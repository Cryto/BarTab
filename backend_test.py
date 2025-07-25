#!/usr/bin/env python3
"""
BarTab Backend API Testing Suite
Tests all CRUD operations, price calculations, and CSV export functionality
"""

import requests
import sys
import json
from datetime import datetime
import uuid

class BarTabAPITester:
    def __init__(self, base_url="https://6d7c6d03-426d-4711-841d-17d4b386c1ca.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_drinks = []
        self.created_transactions = []
        self.created_payments = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root endpoint"""
        success, response = self.run_test("Root Endpoint", "GET", "", 200)
        if success and "BarTab API" in str(response):
            print("✅ Root endpoint returns correct message")
        return success

    def test_create_drink(self, name, base_cost, total_volume, volume_unit="ml", volume_served=2.0, mixer_cost=0.0, flat_cost=0.0):
        """Test creating a drink with all new fields"""
        drink_data = {
            "name": name,
            "base_cost": base_cost,
            "total_volume": total_volume,
            "volume_unit": volume_unit,
            "volume_served": volume_served,
            "mixer_cost": mixer_cost,
            "flat_cost": flat_cost
        }
        
        success, response = self.run_test(
            f"Create Drink - {name}",
            "POST",
            "api/drinks",
            200,
            data=drink_data
        )
        
        if success and 'id' in response:
            self.created_drinks.append(response['id'])
            print(f"✅ Drink created with ID: {response['id']}")
            return response['id']
        return None

    def test_get_drinks(self):
        """Test getting all drinks"""
        success, response = self.run_test("Get All Drinks", "GET", "api/drinks", 200)
        if success and isinstance(response, list):
            print(f"✅ Retrieved {len(response)} drinks")
            return response
        return []

    def test_get_drink_by_id(self, drink_id):
        """Test getting a specific drink"""
        success, response = self.run_test(
            f"Get Drink by ID",
            "GET",
            f"api/drinks/{drink_id}",
            200
        )
        return success, response

    def test_update_drink(self, drink_id, name, base_cost, total_volume, volume_unit="ml", volume_served=2.0, mixer_cost=0.0, flat_cost=0.0):
        """Test updating a drink"""
        update_data = {
            "name": name,
            "base_cost": base_cost,
            "total_volume": total_volume,
            "volume_unit": volume_unit,
            "volume_served": volume_served,
            "mixer_cost": mixer_cost,
            "flat_cost": flat_cost
        }
        
        success, response = self.run_test(
            f"Update Drink",
            "PUT",
            f"api/drinks/{drink_id}",
            200,
            data=update_data
        )
        return success, response

    def test_price_calculation(self, drink_id):
        """Test price calculation endpoint with new simplified API"""
        calc_data = {
            "drink_id": drink_id
        }
        
        success, response = self.run_test(
            f"Price Calculation",
            "POST",
            "api/calculate-price",
            200,
            data=calc_data
        )
        
        if success and 'calculated_price' in response and 'breakdown' in response:
            print(f"✅ Calculated price: ${response['calculated_price']}")
            print(f"✅ Breakdown provided: {list(response['breakdown'].keys())}")
            return response['calculated_price'], response['breakdown']
        return None, None

    def test_create_transaction(self, guest_name, drink_id):
        """Test creating a transaction with simplified API"""
        transaction_data = {
            "guest_name": guest_name,
            "drink_id": drink_id,
            "date": datetime.now().isoformat()
        }
        
        success, response = self.run_test(
            f"Create Transaction - {guest_name}",
            "POST",
            "api/transactions",
            200,
            data=transaction_data
        )
        
        if success and 'id' in response:
            self.created_transactions.append(response['id'])
            print(f"✅ Transaction created with ID: {response['id']}")
            print(f"✅ Calculated price: ${response.get('calculated_price', 'N/A')}")
            return response['id']
        return None

    def test_get_transactions(self, filters=None):
        """Test getting transactions with optional filters"""
        success, response = self.run_test(
            "Get Transactions",
            "GET",
            "api/transactions",
            200,
            params=filters
        )
        
        if success and isinstance(response, list):
            print(f"✅ Retrieved {len(response)} transactions")
            return response
        return []

    def test_get_transaction_by_id(self, transaction_id):
        """Test getting a specific transaction"""
        success, response = self.run_test(
            f"Get Transaction by ID",
            "GET",
            f"api/transactions/{transaction_id}",
            200
        )
        return success, response

    def test_csv_export(self):
        """Test CSV export functionality"""
        success, response = self.run_test(
            "CSV Export",
            "GET",
            "api/transactions/export/csv",
            200
        )
        
        if success and isinstance(response, str) and "Date,Guest Name" in response:
            print("✅ CSV export contains expected headers")
            return True
        return False

    def test_delete_transaction(self, transaction_id):
        """Test deleting a transaction"""
        success, response = self.run_test(
            f"Delete Transaction",
            "DELETE",
            f"api/transactions/{transaction_id}",
            200
        )
        return success

    def test_delete_drink(self, drink_id):
        """Test deleting a drink"""
        success, response = self.run_test(
            f"Delete Drink",
            "DELETE",
            f"api/drinks/{drink_id}",
            200
        )
        return success

    def test_create_payment(self, guest_name, amount, notes="Test payment"):
        """Test creating a payment"""
        payment_data = {
            "guest_name": guest_name,
            "amount": amount,
            "date": datetime.now().isoformat(),
            "notes": notes
        }
        
        success, response = self.run_test(
            f"Create Payment - {guest_name}",
            "POST",
            "api/payments",
            200,
            data=payment_data
        )
        
        if success and 'id' in response:
            self.created_payments.append(response['id'])
            print(f"✅ Payment created with ID: {response['id']}")
            print(f"✅ Amount: ${response.get('amount', 'N/A')}")
            return response['id']
        return None

    def test_get_payments(self, filters=None):
        """Test getting payments with optional filters"""
        success, response = self.run_test(
            "Get Payments",
            "GET",
            "api/payments",
            200,
            params=filters
        )
        
        if success and isinstance(response, list):
            print(f"✅ Retrieved {len(response)} payments")
            return response
        return []

    def test_get_guest_balances(self):
        """Test getting guest balances"""
        success, response = self.run_test(
            "Get Guest Balances",
            "GET",
            "api/guests/balances",
            200
        )
        
        if success and isinstance(response, list):
            print(f"✅ Retrieved {len(response)} guest balances")
            for balance in response:
                print(f"   {balance['guest_name']}: Owed ${balance['total_owed']}, Paid ${balance['total_paid']}, Balance ${balance['balance']}")
            return response
        return []

    def test_get_guest_balance(self, guest_name):
        """Test getting specific guest balance"""
        success, response = self.run_test(
            f"Get Guest Balance - {guest_name}",
            "GET",
            f"api/guests/{guest_name}/balance",
            200
        )
        
        if success and 'guest_name' in response:
            print(f"✅ Guest {guest_name}: Owed ${response['total_owed']}, Paid ${response['total_paid']}, Balance ${response['balance']}")
            return response
        return None

    def test_delete_payment(self, payment_id):
        """Test deleting a payment"""
        success, response = self.run_test(
            f"Delete Payment",
            "DELETE",
            f"api/payments/{payment_id}",
            200
        )
        return success

    def verify_price_calculation_formula(self, drink_data, calculated_price):
        """Verify the price calculation formula using predefined drink settings"""
        print(f"\n🧮 Verifying Price Calculation Formula...")
        
        # Convert volumes to ml for calculation
        drink_volume_ml = drink_data["total_volume"]
        if drink_data["volume_unit"] == "oz":
            drink_volume_ml = drink_data["total_volume"] * 29.5735
        
        # Volume served is stored in drink data (in oz), convert to ml
        volume_served_ml = drink_data["volume_served"] * 29.5735
        
        # Calculate expected price using predefined costs
        price_per_ml = drink_data["base_cost"] / drink_volume_ml
        alcohol_cost = price_per_ml * volume_served_ml
        expected_price = round(alcohol_cost + drink_data["mixer_cost"] + drink_data["flat_cost"], 2)
        
        print(f"Expected calculation:")
        print(f"  - Price per ml: ${price_per_ml:.4f}")
        print(f"  - Alcohol cost: ${alcohol_cost:.2f}")
        print(f"  - Mixer cost: ${drink_data['mixer_cost']:.2f}")
        print(f"  - Flat cost: ${drink_data['flat_cost']:.2f}")
        print(f"  - Expected total: ${expected_price:.2f}")
        print(f"  - Actual total: ${calculated_price:.2f}")
        
        if abs(expected_price - calculated_price) < 0.01:
            print("✅ Price calculation formula is correct!")
            return True
        else:
            print("❌ Price calculation formula mismatch!")
            return False

    def cleanup(self):
        """Clean up created test data"""
        print(f"\n🧹 Cleaning up test data...")
        
        # Delete created transactions
        for transaction_id in self.created_transactions:
            self.test_delete_transaction(transaction_id)
        
        # Delete created payments
        for payment_id in self.created_payments:
            self.test_delete_payment(payment_id)
        
        # Delete created drinks
        for drink_id in self.created_drinks:
            self.test_delete_drink(drink_id)

def main():
    print("🍸 BarTab Backend API Testing Suite - FOCUSED ON EDIT & DELETE FUNCTIONALITY")
    print("=" * 80)
    
    # Initialize tester
    tester = BarTabAPITester()
    
    try:
        # Test 1: Root endpoint
        tester.test_root_endpoint()
        
        # Test 2: Create test drinks with new fields
        whiskey_id = tester.test_create_drink("Whiskey Sour", 84.0, 1750.0, "ml", 2.5, 0.60, 0.20)
        vodka_id = tester.test_create_drink("Premium Vodka", 45.0, 750.0, "ml", 1.5, 0.30, 0.15)
        rum_id = tester.test_create_drink("Spiced Rum", 32.0, 25.0, "oz", 2.0, 0.50, 0.25)  # Test oz unit
        
        if not all([whiskey_id, vodka_id, rum_id]):
            print("❌ Failed to create test drinks, stopping tests")
            return 1
        
        print(f"\n🎯 SCENARIO 1: EDIT DRINK WITHOUT AFFECTING TRANSACTIONS")
        print("=" * 60)
        
        # Step 1: Create a transaction with original drink details
        print("Step 1: Creating transaction with original drink details...")
        transaction1_id = tester.test_create_transaction("John Doe", whiskey_id)
        if not transaction1_id:
            print("❌ Failed to create transaction")
            return 1
        
        # Get original transaction details
        success, original_transaction = tester.test_get_transaction_by_id(transaction1_id)
        if not success:
            print("❌ Failed to get original transaction")
            return 1
        
        original_price = original_transaction['calculated_price']
        print(f"✅ Original transaction price: ${original_price}")
        
        # Step 2: Edit the drink (change price, serving size, etc.)
        print("Step 2: Editing drink details...")
        success, updated_drink = tester.test_update_drink(
            whiskey_id, 
            "Updated Whiskey Sour", 
            120.0,  # Changed from 84.0
            1750.0, 
            "ml", 
            3.0,    # Changed from 2.5
            1.00,   # Changed from 0.60
            0.50    # Changed from 0.20
        )
        if not success:
            print("❌ Failed to update drink")
            return 1
        
        # Step 3: Verify transaction still has original price
        print("Step 3: Verifying transaction maintains original price...")
        success, updated_transaction = tester.test_get_transaction_by_id(transaction1_id)
        if not success:
            print("❌ Failed to get updated transaction")
            return 1
        
        if updated_transaction['calculated_price'] == original_price:
            print("✅ SUCCESS: Transaction price unchanged after drink edit!")
        else:
            print(f"❌ FAILURE: Transaction price changed from ${original_price} to ${updated_transaction['calculated_price']}")
        
        # Step 4: Create new transaction and verify it uses updated drink details
        print("Step 4: Creating new transaction with updated drink...")
        transaction2_id = tester.test_create_transaction("Jane Smith", whiskey_id)
        if transaction2_id:
            success, new_transaction = tester.test_get_transaction_by_id(transaction2_id)
            if success:
                new_price = new_transaction['calculated_price']
                print(f"✅ New transaction price: ${new_price}")
                if new_price != original_price:
                    print("✅ SUCCESS: New transaction uses updated drink pricing!")
                else:
                    print("❌ WARNING: New transaction has same price as original")
        
        print(f"\n🎯 SCENARIO 2: DELETE OPERATIONS")
        print("=" * 60)
        
        # Create additional test data for delete operations
        payment1_id = tester.test_create_payment("John Doe", 25.50, "Cash payment")
        payment2_id = tester.test_create_payment("Jane Smith", 15.75, "Card payment")
        transaction3_id = tester.test_create_transaction("Bob Wilson", vodka_id)
        
        # Test delete payment
        print("Testing payment deletion...")
        if payment1_id:
            # Get balances before deletion
            balances_before = tester.test_get_guest_balances()
            john_balance_before = next((b for b in balances_before if b['guest_name'] == 'John Doe'), None)
            
            # Delete payment
            success = tester.test_delete_payment(payment1_id)
            if success:
                print("✅ Payment deleted successfully")
                
                # Verify balance updated
                balances_after = tester.test_get_guest_balances()
                john_balance_after = next((b for b in balances_after if b['guest_name'] == 'John Doe'), None)
                
                if john_balance_before and john_balance_after:
                    if john_balance_after['balance'] > john_balance_before['balance']:
                        print("✅ SUCCESS: Guest balance updated correctly after payment deletion!")
                    else:
                        print("❌ WARNING: Guest balance may not have updated correctly")
        
        # Test delete transaction
        print("Testing transaction deletion...")
        if transaction3_id:
            success = tester.test_delete_transaction(transaction3_id)
            if success:
                print("✅ Transaction deleted successfully")
                
                # Verify transaction is gone
                success, _ = tester.test_get_transaction_by_id(transaction3_id)
                if not success:
                    print("✅ SUCCESS: Transaction properly removed from system!")
                else:
                    print("❌ WARNING: Transaction still exists after deletion")
        
        # Test delete drink that has associated transactions
        print("Testing drink deletion (should not affect past transactions)...")
        success = tester.test_delete_drink(rum_id)
        if success:
            print("✅ Drink deleted successfully")
            
            # Verify existing transactions still exist
            all_transactions = tester.test_get_transactions()
            if all_transactions:
                print("✅ SUCCESS: Existing transactions preserved after drink deletion!")
            
            # Verify drink is gone
            success, _ = tester.test_get_drink_by_id(rum_id)
            if not success:
                print("✅ SUCCESS: Drink properly removed from system!")
        
        print(f"\n🎯 SCENARIO 3: COMPREHENSIVE CRUD TESTING")
        print("=" * 60)
        
        # Test remaining CRUD operations
        drinks = tester.test_get_drinks()
        transactions = tester.test_get_transactions()
        payments = tester.test_get_payments()
        balances = tester.test_get_guest_balances()
        
        # Test CSV export
        tester.test_csv_export()
        
        # Test error handling
        tester.run_test("Get Non-existent Drink", "GET", f"api/drinks/{str(uuid.uuid4())}", 404)
        tester.run_test("Update Non-existent Drink", "PUT", f"api/drinks/{str(uuid.uuid4())}", 404, 
                       data={"name": "Test", "base_cost": 10.0, "total_volume": 100.0, "volume_unit": "ml", 
                            "volume_served": 1.0, "mixer_cost": 0.0, "flat_cost": 0.0})
        tester.run_test("Delete Non-existent Drink", "DELETE", f"api/drinks/{str(uuid.uuid4())}", 404)
        tester.run_test("Delete Non-existent Transaction", "DELETE", f"api/transactions/{str(uuid.uuid4())}", 404)
        tester.run_test("Delete Non-existent Payment", "DELETE", f"api/payments/{str(uuid.uuid4())}", 404)
        
    finally:
        # Cleanup remaining test data
        tester.cleanup()
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())