import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import ServeForm from './ServeForm';
import TransactionHistory from './TransactionHistory';
import TabsView from './TabsView';
import PaymentsView from './PaymentsView';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [drinks, setDrinks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load initial data
  useEffect(() => {
    loadDrinks();
    loadTransactions();
  }, []);

  const loadDrinks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/drinks`);
      setDrinks(response.data);
    } catch (err) {
      setError('Failed to load drinks');
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/transactions`);
      setTransactions(response.data);
    } catch (err) {
      setError('Failed to load transactions');
    }
  };

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink to-pastel-blue">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🍸 BarTab
          </h1>
          <p className="text-gray-600">Professional Bar Management System</p>
        </header>

        {/* Navigation */}
        <nav className="pastel-nav rounded-lg mb-8 p-4">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                currentView === 'dashboard'
                  ? 'bg-pastel-blue text-blue-700 shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-pastel-blue hover:text-blue-700'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setCurrentView('drinks')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                currentView === 'drinks'
                  ? 'bg-pastel-green text-green-700 shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-pastel-green hover:text-green-700'
              }`}
            >
              🍹 Manage Drinks
            </button>
            <button
              onClick={() => setCurrentView('serve')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                currentView === 'serve'
                  ? 'bg-pastel-yellow text-yellow-700 shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-pastel-yellow hover:text-yellow-700'
              }`}
            >
              🍷 Serve Drinks
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                currentView === 'history'
                  ? 'bg-pastel-purple text-purple-700 shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-pastel-purple hover:text-purple-700'
              }`}
            >
              📜 Transaction History
            </button>
          </div>
        </nav>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Main Content */}
        <main className="pastel-card rounded-lg p-6 shadow-lg">
          {currentView === 'dashboard' && (
            <Dashboard 
              drinks={drinks} 
              transactions={transactions} 
              onExportCSV={() => window.open(`${API_BASE_URL}/api/transactions/export/csv`)}
            />
          )}
          {currentView === 'drinks' && (
            <DrinkManager 
              drinks={drinks} 
              onDrinkAdded={loadDrinks}
              onDrinkDeleted={loadDrinks}
              showMessage={showMessage}
            />
          )}
          {currentView === 'serve' && (
            <ServeForm 
              drinks={drinks} 
              onTransactionAdded={loadTransactions}
              showMessage={showMessage}
            />
          )}
          {currentView === 'history' && (
            <TransactionHistory 
              transactions={transactions} 
              drinks={drinks}
              onTransactionDeleted={loadTransactions}
              showMessage={showMessage}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ drinks, transactions, onExportCSV }) {
  const totalRevenue = transactions.reduce((sum, t) => sum + t.calculated_price, 0);
  const totalTransactions = transactions.length;
  const uniqueGuests = new Set(transactions.map(t => t.guest_name)).size;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-pastel-blue p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-700 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-blue-800">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-pastel-green p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-700 mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold text-green-800">{totalTransactions}</p>
        </div>
        <div className="bg-pastel-yellow p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-700 mb-2">Unique Guests</h3>
          <p className="text-3xl font-bold text-yellow-800">{uniqueGuests}</p>
        </div>
        <div className="bg-pastel-purple p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-700 mb-2">Drinks in Menu</h3>
          <p className="text-3xl font-bold text-purple-800">{drinks.length}</p>
        </div>
      </div>

      {/* Export Button */}
      <div className="text-center mb-8">
        <button
          onClick={onExportCSV}
          className="pastel-button bg-pastel-mint text-green-700 px-8 py-3 rounded-lg font-medium hover:bg-green-100 transition-all duration-300"
        >
          📥 Export Transactions to CSV
        </button>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-pastel-blue">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Drink</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.slice(0, 5).map((transaction) => {
                const drink = drinks.find(d => d.id === transaction.drink_id);
                return (
                  <tr key={transaction.id} className="hover:bg-pastel-blue hover:bg-opacity-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.guest_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {drink ? drink.name : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${transaction.calculated_price.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Drink Manager Component
function DrinkManager({ drinks, onDrinkAdded, onDrinkDeleted, showMessage }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    base_cost: '',
    total_volume: '',
    volume_unit: 'ml',
    volume_served: '2.0',
    mixer_cost: '0',
    flat_cost: '0'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/drinks`, {
        ...formData,
        base_cost: parseFloat(formData.base_cost),
        total_volume: parseFloat(formData.total_volume),
        volume_served: parseFloat(formData.volume_served),
        mixer_cost: parseFloat(formData.mixer_cost),
        flat_cost: parseFloat(formData.flat_cost)
      });
      showMessage('Drink added successfully!');
      setFormData({ 
        name: '', 
        base_cost: '', 
        total_volume: '', 
        volume_unit: 'ml',
        volume_served: '2.0',
        mixer_cost: '0',
        flat_cost: '0'
      });
      setShowForm(false);
      onDrinkAdded();
    } catch (err) {
      showMessage('Failed to add drink', 'error');
    }
  };

  const handleDelete = async (drinkId) => {
    if (window.confirm('Are you sure you want to delete this drink?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/drinks/${drinkId}`);
        showMessage('Drink deleted successfully!');
        onDrinkDeleted();
      } catch (err) {
        showMessage('Failed to delete drink', 'error');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🍹 Manage Drinks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="pastel-button bg-pastel-green text-green-700 px-6 py-2 rounded-lg font-medium hover:bg-green-100"
        >
          {showForm ? 'Cancel' : '+ Add Drink'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-pastel-green bg-opacity-30 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4">Add New Drink</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Drink Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="pastel-input w-full px-3 py-2 rounded-lg"
                placeholder="e.g., Whiskey Sour"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.base_cost}
                onChange={(e) => setFormData({...formData, base_cost: e.target.value})}
                className="pastel-input w-full px-3 py-2 rounded-lg"
                placeholder="e.g., 84.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Volume</label>
              <input
                type="number"
                step="0.01"
                value={formData.total_volume}
                onChange={(e) => setFormData({...formData, total_volume: e.target.value})}
                className="pastel-input w-full px-3 py-2 rounded-lg"
                placeholder="e.g., 1750"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Volume Unit</label>
              <select
                value={formData.volume_unit}
                onChange={(e) => setFormData({...formData, volume_unit: e.target.value})}
                className="pastel-input w-full px-3 py-2 rounded-lg"
              >
                <option value="ml">Milliliters (ml)</option>
                <option value="oz">Ounces (oz)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Serving Size (oz)</label>
              <input
                type="number"
                step="0.1"
                value={formData.volume_served}
                onChange={(e) => setFormData({...formData, volume_served: e.target.value})}
                className="pastel-input w-full px-3 py-2 rounded-lg"
                placeholder="e.g., 2.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mixer Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.mixer_cost}
                onChange={(e) => setFormData({...formData, mixer_cost: e.target.value})}
                className="pastel-input w-full px-3 py-2 rounded-lg"
                placeholder="e.g., 0.60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Flat Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.flat_cost}
                onChange={(e) => setFormData({...formData, flat_cost: e.target.value})}
                className="pastel-input w-full px-3 py-2 rounded-lg"
                placeholder="e.g., 0.20"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              className="pastel-button bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600"
            >
              Add Drink
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drinks.map((drink) => (
          <div key={drink.id} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{drink.name}</h3>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p><strong>Base Cost:</strong> ${drink.base_cost.toFixed(2)}</p>
              <p><strong>Volume:</strong> {drink.total_volume} {drink.volume_unit}</p>
              <p><strong>Serving Size:</strong> {drink.volume_served} oz</p>
              <p><strong>Mixer Cost:</strong> ${drink.mixer_cost.toFixed(2)}</p>
              <p><strong>Flat Cost:</strong> ${drink.flat_cost.toFixed(2)}</p>
              <p><strong>Price per Serving:</strong> ${((drink.base_cost / (drink.volume_unit === 'oz' ? drink.total_volume * 29.5735 : drink.total_volume)) * (drink.volume_served * 29.5735) + drink.mixer_cost + drink.flat_cost).toFixed(2)}</p>
            </div>
            <button
              onClick={() => handleDelete(drink.id)}
              className="pastel-button bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-200"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;