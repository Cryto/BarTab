import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function TransactionHistory({ transactions, drinks, onTransactionDeleted, showMessage }) {
  const [filters, setFilters] = useState({
    guest_name: '',
    drink_id: '',
    start_date: '',
    end_date: ''
  });

  const filteredTransactions = transactions.filter(transaction => {
    const matchesGuest = !filters.guest_name || 
      transaction.guest_name.toLowerCase().includes(filters.guest_name.toLowerCase());
    
    const matchesDrink = !filters.drink_id || transaction.drink_id === filters.drink_id;
    
    const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
    const matchesStartDate = !filters.start_date || transactionDate >= filters.start_date;
    const matchesEndDate = !filters.end_date || transactionDate <= filters.end_date;
    
    return matchesGuest && matchesDrink && matchesStartDate && matchesEndDate;
  });

  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/transactions/${transactionId}`);
        console.log('Delete transaction response:', response);
        showMessage('Transaction deleted successfully!');
        onTransactionDeleted();
      } catch (err) {
        console.error('Error deleting transaction:', err);
        showMessage('Failed to delete transaction', 'error');
      }
    }
  };

  const clearFilters = () => {
    setFilters({
      guest_name: '',
      drink_id: '',
      start_date: '',
      end_date: ''
    });
  };

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.calculated_price, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📜 Transaction History</h2>
      
      {/* Filters */}
      <div className="bg-pastel-blue bg-opacity-30 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-blue-700 mb-4">🔍 Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name</label>
            <input
              type="text"
              value={filters.guest_name}
              onChange={(e) => setFilters({...filters, guest_name: e.target.value})}
              className="pastel-input w-full px-3 py-2 rounded-lg"
              placeholder="Search by guest name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Drink</label>
            <select
              value={filters.drink_id}
              onChange={(e) => setFilters({...filters, drink_id: e.target.value})}
              className="pastel-input w-full px-3 py-2 rounded-lg"
            >
              <option value="">All drinks</option>
              {drinks.map((drink) => (
                <option key={drink.id} value={drink.id}>
                  {drink.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({...filters, start_date: e.target.value})}
              className="pastel-input w-full px-3 py-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({...filters, end_date: e.target.value})}
              className="pastel-input w-full px-3 py-2 rounded-lg"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={clearFilters}
            className="pastel-button bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200"
          >
            Clear Filters
          </button>
          <div className="flex-1 text-right">
            <span className="text-sm text-gray-600">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-pastel-green bg-opacity-30 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-green-700 mb-2">📊 Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">{filteredTransactions.length}</div>
            <div className="text-sm text-green-600">Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">${totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-green-600">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">
              ${filteredTransactions.length > 0 ? (totalRevenue / filteredTransactions.length).toFixed(2) : '0.00'}
            </div>
            <div className="text-sm text-green-600">Average per Transaction</div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-pastel-purple">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Drink</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const drink = drinks.find(d => d.id === transaction.drink_id);
                return (
                  <tr key={transaction.id} className="hover:bg-pastel-purple hover:bg-opacity-20">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No transactions found</div>
            <div className="text-gray-500 text-sm mt-2">
              {transactions.length === 0 ? 'No transactions have been recorded yet.' : 'Try adjusting your filters.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionHistory;