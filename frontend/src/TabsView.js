import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function TabsView({ showMessage }) {
  const [guestBalances, setGuestBalances] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadGuestBalances = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/guests/balances`);
      setGuestBalances(response.data);
    } catch (err) {
      showMessage('Failed to load guest balances', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuestBalances();
  }, []);

  const totalOutstanding = guestBalances.reduce((sum, guest) => sum + Math.max(0, guest.balance), 0);
  const guestsWithDebt = guestBalances.filter(guest => guest.balance > 0).length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🧾 Guest Tabs</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-pastel-orange p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-700 mb-2">Total Outstanding</h3>
          <p className="text-3xl font-bold text-orange-800">${totalOutstanding.toFixed(2)}</p>
        </div>
        <div className="bg-pastel-cyan p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-cyan-700 mb-2">Guests with Tabs</h3>
          <p className="text-3xl font-bold text-cyan-800">{guestsWithDebt}</p>
        </div>
        <div className="bg-pastel-mint p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-700 mb-2">Total Guests</h3>
          <p className="text-3xl font-bold text-green-800">{guestBalances.length}</p>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center mb-6">
        <button
          onClick={loadGuestBalances}
          disabled={loading}
          className="pastel-button bg-pastel-blue text-blue-700 px-6 py-2 rounded-lg font-medium hover:bg-blue-100 disabled:bg-gray-400"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Balances'}
        </button>
      </div>

      {/* Guest Balances Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-pastel-lavender">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Guest Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Total Owed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Total Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {guestBalances.map((guest) => (
                <tr key={guest.guest_name} className="hover:bg-pastel-lavender hover:bg-opacity-20">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {guest.guest_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${guest.total_owed.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${guest.total_paid.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={guest.balance > 0 ? 'text-red-600' : guest.balance < 0 ? 'text-green-600' : 'text-gray-900'}>
                      ${guest.balance.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {guest.balance > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Owes Money
                      </span>
                    )}
                    {guest.balance === 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid Up
                      </span>
                    )}
                    {guest.balance < 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Credit Balance
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {guestBalances.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No guest data found</div>
            <div className="text-gray-500 text-sm mt-2">
              Guest tabs will appear here once you start recording transactions.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TabsView;