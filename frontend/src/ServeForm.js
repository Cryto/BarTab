import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function ServeForm({ drinks, onTransactionAdded, showMessage }) {
  const [formData, setFormData] = useState({
    guest_name: '',
    drink_id: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [priceCalculation, setPriceCalculation] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const calculatePrice = async () => {
    if (!formData.drink_id) return;
    
    setCalculating(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/calculate-price`, {
        drink_id: formData.drink_id
      });
      setPriceCalculation(response.data);
    } catch (err) {
      showMessage('Failed to calculate price', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/transactions`, {
        ...formData,
        date: new Date(formData.date).toISOString()
      });
      showMessage('Transaction recorded successfully!');
      setFormData({
        guest_name: '',
        drink_id: '',
        date: new Date().toISOString().split('T')[0]
      });
      setPriceCalculation(null);
      onTransactionAdded();
    } catch (err) {
      showMessage('Failed to record transaction', 'error');
    }
  };

  // Auto-calculate price when drink changes
  React.useEffect(() => {
    if (formData.drink_id) {
      calculatePrice();
    } else {
      setPriceCalculation(null);
    }
  }, [formData.drink_id]);

  const selectedDrink = drinks.find(d => d.id === formData.drink_id);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🍷 Serve Drinks</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Information */}
        <div className="bg-pastel-blue bg-opacity-30 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">Guest Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name</label>
              <input
                type="text"
                value={formData.guest_name}
                onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                className="pastel-input w-full px-3 py-2 rounded-lg"
                required
                placeholder="Enter guest name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="pastel-input w-full px-3 py-2 rounded-lg"
                required
              />
            </div>
          </div>
        </div>

        {/* Drink Selection */}
        <div className="bg-pastel-green bg-opacity-30 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-700 mb-4">Drink Selection</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Drink</label>
            <select
              value={formData.drink_id}
              onChange={(e) => setFormData({...formData, drink_id: e.target.value})}
              className="pastel-input w-full px-3 py-2 rounded-lg"
              required
            >
              <option value="">Select a drink...</option>
              {drinks.map((drink) => (
                <option key={drink.id} value={drink.id}>
                  {drink.name} - ${((drink.base_cost / (drink.volume_unit === 'oz' ? drink.total_volume * 29.5735 : drink.total_volume)) * (drink.volume_served * 29.5735) + drink.mixer_cost + drink.flat_cost).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          
          {selectedDrink && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Selected Drink Details:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>Name: {selectedDrink.name}</div>
                <div>Base Cost: ${selectedDrink.base_cost}</div>
                <div>Total Volume: {selectedDrink.total_volume} {selectedDrink.volume_unit}</div>
                <div>Serving Size: {selectedDrink.volume_served} oz</div>
                <div>Mixer Cost: ${selectedDrink.mixer_cost}</div>
                <div>Flat Cost: ${selectedDrink.flat_cost}</div>
              </div>
            </div>
          )}
        </div>

        {/* Price Calculation */}
        {priceCalculation && (
          <div className="bg-pastel-purple bg-opacity-30 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-700 mb-4">💰 Price Calculation</h3>
            <div className="bg-white p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Calculation Breakdown:</h4>
                  <div className="space-y-1 text-gray-600">
                    <div>Base Cost: ${priceCalculation.breakdown.base_cost}</div>
                    <div>Total Volume: {priceCalculation.breakdown.total_volume} {priceCalculation.breakdown.volume_unit}</div>
                    <div>Volume Served: {priceCalculation.breakdown.volume_served} oz</div>
                    <div>Price per ml: ${priceCalculation.breakdown.price_per_ml}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Cost Components:</h4>
                  <div className="space-y-1 text-gray-600">
                    <div>Alcohol Cost: ${priceCalculation.breakdown.alcohol_cost}</div>
                    <div>Mixer Cost: ${priceCalculation.breakdown.mixer_cost}</div>
                    <div>Flat Cost: ${priceCalculation.breakdown.flat_cost}</div>
                    <div className="border-t pt-1 font-semibold text-gray-800">
                      Total Price: ${priceCalculation.breakdown.total_price}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            disabled={calculating || !priceCalculation}
            className="pastel-button bg-green-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {calculating ? 'Calculating...' : `Record Transaction ${priceCalculation ? `- $${priceCalculation.calculated_price}` : ''}`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ServeForm;