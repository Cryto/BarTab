from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from pymongo import MongoClient
import uuid
from datetime import datetime
import csv
import io
import os

app = FastAPI(title="BarTab API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.bartab
drinks_collection = db.drinks
transactions_collection = db.transactions
payments_collection = db.payments

# Pydantic models
class DrinkBase(BaseModel):
    name: str
    base_cost: float
    total_volume: float
    volume_unit: str = "ml"  # ml or oz
    volume_served: float = 2.0  # Default serving size in oz
    mixer_cost: float = 0.0
    flat_cost: float = 0.0

class DrinkCreate(DrinkBase):
    pass

class Drink(DrinkBase):
    id: str
    created_at: datetime

class TransactionBase(BaseModel):
    guest_name: str
    drink_id: str
    date: Optional[datetime] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: str
    calculated_price: float
    created_at: datetime

class PaymentBase(BaseModel):
    guest_name: str
    amount: float
    date: Optional[datetime] = None
    notes: str = ""

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: str
    created_at: datetime

class GuestBalance(BaseModel):
    guest_name: str
    total_owed: float
    total_paid: float
    balance: float

class PriceCalculationRequest(BaseModel):
    drink_id: str
    volume_served: float
    mixer_cost: float = 0.0
    flat_cost: float = 0.0

class PriceCalculationResponse(BaseModel):
    calculated_price: float
    breakdown: dict

# Utility functions
def convert_ml_to_oz(ml: float) -> float:
    return ml / 29.5735

def convert_oz_to_ml(oz: float) -> float:
    return oz * 29.5735

def calculate_drink_price(drink: dict) -> float:
    """Calculate price based on the predefined drink settings"""
    
    # Convert volumes to same unit (ml) for calculation
    drink_volume_ml = drink["total_volume"]
    if drink["volume_unit"] == "oz":
        drink_volume_ml = convert_oz_to_ml(drink["total_volume"])
    
    # Volume served is stored in oz, convert to ml
    volume_served_ml = convert_oz_to_ml(drink["volume_served"])
    
    # Calculate price per ml
    price_per_ml = drink["base_cost"] / drink_volume_ml
    
    # Calculate total price
    alcohol_cost = price_per_ml * volume_served_ml
    total_price = alcohol_cost + drink["mixer_cost"] + drink["flat_cost"]
    
    return round(total_price, 2)

# API Routes

@app.get("/")
async def root():
    return {"message": "BarTab API - Bar Management System"}

# Drinks Management
@app.post("/api/drinks", response_model=Drink)
async def create_drink(drink: DrinkCreate):
    drink_id = str(uuid.uuid4())
    drink_data = {
        "id": drink_id,
        "name": drink.name,
        "base_cost": drink.base_cost,
        "total_volume": drink.total_volume,
        "volume_unit": drink.volume_unit,
        "volume_served": drink.volume_served,
        "mixer_cost": drink.mixer_cost,
        "flat_cost": drink.flat_cost,
        "created_at": datetime.now()
    }
    
    drinks_collection.insert_one(drink_data)
    return Drink(**drink_data)

@app.get("/api/drinks", response_model=List[Drink])
async def get_drinks():
    drinks = list(drinks_collection.find({}, {"_id": 0}))
    return [Drink(**drink) for drink in drinks]

@app.get("/api/drinks/{drink_id}", response_model=Drink)
async def get_drink(drink_id: str):
    drink = drinks_collection.find_one({"id": drink_id}, {"_id": 0})
    if not drink:
        raise HTTPException(status_code=404, detail="Drink not found")
    return Drink(**drink)

@app.put("/api/drinks/{drink_id}", response_model=Drink)
async def update_drink(drink_id: str, drink: DrinkCreate):
    existing_drink = drinks_collection.find_one({"id": drink_id})
    if not existing_drink:
        raise HTTPException(status_code=404, detail="Drink not found")
    
    updated_data = {
        "name": drink.name,
        "base_cost": drink.base_cost,
        "total_volume": drink.total_volume,
        "volume_unit": drink.volume_unit,
        "volume_served": drink.volume_served,
        "mixer_cost": drink.mixer_cost,
        "flat_cost": drink.flat_cost
    }
    
    drinks_collection.update_one({"id": drink_id}, {"$set": updated_data})
    
    updated_drink = drinks_collection.find_one({"id": drink_id}, {"_id": 0})
    return Drink(**updated_drink)

@app.delete("/api/drinks/{drink_id}")
async def delete_drink(drink_id: str):
    result = drinks_collection.delete_one({"id": drink_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Drink not found")
    return {"message": "Drink deleted successfully"}

# Price Calculation
@app.post("/api/calculate-price", response_model=PriceCalculationResponse)
async def calculate_price(request: PriceCalculationRequest):
    drink = drinks_collection.find_one({"id": request.drink_id}, {"_id": 0})
    if not drink:
        raise HTTPException(status_code=404, detail="Drink not found")
    
    calculated_price = calculate_drink_price(drink)
    
    # Create breakdown for transparency
    drink_volume_ml = drink["total_volume"]
    if drink["volume_unit"] == "oz":
        drink_volume_ml = convert_oz_to_ml(drink["total_volume"])
    
    volume_served_ml = convert_oz_to_ml(drink["volume_served"])
    price_per_ml = drink["base_cost"] / drink_volume_ml
    alcohol_cost = price_per_ml * volume_served_ml
    
    breakdown = {
        "base_cost": drink["base_cost"],
        "total_volume": drink["total_volume"],
        "volume_unit": drink["volume_unit"],
        "volume_served": drink["volume_served"],
        "price_per_ml": round(price_per_ml, 4),
        "alcohol_cost": round(alcohol_cost, 2),
        "mixer_cost": drink["mixer_cost"],
        "flat_cost": drink["flat_cost"],
        "total_price": calculated_price
    }
    
    return PriceCalculationResponse(calculated_price=calculated_price, breakdown=breakdown)

# Transactions Management
@app.post("/api/transactions", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate):
    # Get drink for price calculation
    drink = drinks_collection.find_one({"id": transaction.drink_id}, {"_id": 0})
    if not drink:
        raise HTTPException(status_code=404, detail="Drink not found")
    
    # Calculate price using predefined drink settings
    calculated_price = calculate_drink_price(drink)
    
    transaction_id = str(uuid.uuid4())
    transaction_data = {
        "id": transaction_id,
        "guest_name": transaction.guest_name,
        "drink_id": transaction.drink_id,
        "calculated_price": calculated_price,
        "date": transaction.date or datetime.now(),
        "created_at": datetime.now()
    }
    
    transactions_collection.insert_one(transaction_data)
    return Transaction(**transaction_data)

@app.get("/api/transactions", response_model=List[Transaction])
async def get_transactions(
    guest_name: Optional[str] = None,
    drink_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = {}
    
    if guest_name:
        query["guest_name"] = {"$regex": guest_name, "$options": "i"}
    
    if drink_id:
        query["drink_id"] = drink_id
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            date_query["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query["date"] = date_query
    
    transactions = list(transactions_collection.find(query, {"_id": 0}).sort("date", -1))
    return [Transaction(**transaction) for transaction in transactions]

@app.get("/api/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str):
    transaction = transactions_collection.find_one({"id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return Transaction(**transaction)

@app.delete("/api/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    result = transactions_collection.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}

# CSV Export
@app.get("/api/transactions/export/csv")
async def export_transactions_csv():
    transactions = list(transactions_collection.find({}, {"_id": 0}).sort("date", -1))
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Date", "Guest Name", "Drink ID", "Calculated Price", "Transaction ID"
    ])
    
    # Write data
    for transaction in transactions:
        writer.writerow([
            transaction["date"].strftime("%Y-%m-%d %H:%M:%S"),
            transaction["guest_name"],
            transaction["drink_id"],
            transaction["calculated_price"],
            transaction["id"]
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bartab_transactions.csv"}
    )

# Payments Management
@app.post("/api/payments", response_model=Payment)
async def create_payment(payment: PaymentCreate):
    payment_id = str(uuid.uuid4())
    payment_data = {
        "id": payment_id,
        "guest_name": payment.guest_name,
        "amount": payment.amount,
        "date": payment.date or datetime.now(),
        "notes": payment.notes,
        "created_at": datetime.now()
    }
    
    payments_collection.insert_one(payment_data)
    return Payment(**payment_data)

@app.get("/api/payments", response_model=List[Payment])
async def get_payments(guest_name: Optional[str] = None):
    query = {}
    if guest_name:
        query["guest_name"] = {"$regex": guest_name, "$options": "i"}
    
    payments = list(payments_collection.find(query, {"_id": 0}).sort("date", -1))
    return [Payment(**payment) for payment in payments]

@app.get("/api/payments/{payment_id}", response_model=Payment)
async def get_payment(payment_id: str):
    payment = payments_collection.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return Payment(**payment)

@app.delete("/api/payments/{payment_id}")
async def delete_payment(payment_id: str):
    result = payments_collection.delete_one({"id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Payment deleted successfully"}

# Guest Balance Management
@app.get("/api/guests/balances", response_model=List[GuestBalance])
async def get_guest_balances():
    # Get all transactions grouped by guest
    transactions_by_guest = {}
    transactions = list(transactions_collection.find({}, {"_id": 0}))
    for transaction in transactions:
        guest = transaction["guest_name"]
        if guest not in transactions_by_guest:
            transactions_by_guest[guest] = 0
        transactions_by_guest[guest] += transaction["calculated_price"]
    
    # Get all payments grouped by guest
    payments_by_guest = {}
    payments = list(payments_collection.find({}, {"_id": 0}))
    for payment in payments:
        guest = payment["guest_name"]
        if guest not in payments_by_guest:
            payments_by_guest[guest] = 0
        payments_by_guest[guest] += payment["amount"]
    
    # Calculate balances
    all_guests = set(list(transactions_by_guest.keys()) + list(payments_by_guest.keys()))
    balances = []
    
    for guest in all_guests:
        total_owed = transactions_by_guest.get(guest, 0.0)
        total_paid = payments_by_guest.get(guest, 0.0)
        balance = total_owed - total_paid
        
        balances.append(GuestBalance(
            guest_name=guest,
            total_owed=round(total_owed, 2),
            total_paid=round(total_paid, 2),
            balance=round(balance, 2)
        ))
    
    # Sort by balance descending (highest debt first)
    balances.sort(key=lambda x: x.balance, reverse=True)
    return balances

@app.get("/api/guests/{guest_name}/balance", response_model=GuestBalance)
async def get_guest_balance(guest_name: str):
    # Get guest transactions
    transactions = list(transactions_collection.find({"guest_name": guest_name}, {"_id": 0}))
    total_owed = sum(t["calculated_price"] for t in transactions)
    
    # Get guest payments
    payments = list(payments_collection.find({"guest_name": guest_name}, {"_id": 0}))
    total_paid = sum(p["amount"] for p in payments)
    
    balance = total_owed - total_paid
    
    return GuestBalance(
        guest_name=guest_name,
        total_owed=round(total_owed, 2),
        total_paid=round(total_paid, 2),
        balance=round(balance, 2)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)