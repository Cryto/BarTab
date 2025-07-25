import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function PaymentsView({ showMessage }) {
  const [payments, setPayments] = useState([]);
  const [guestBalances, setGuestBalances] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    guest_name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const loadPayments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/payments`);
      setPayments(response.data);
    } catch (err) {
      showMessage('Failed to load payments', 'error');
    }
  };

  const loadGuestBalances = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/guests/balances`);
      setGuestBalances(response.data);
    } catch (err) {
      showMessage('Failed to load guest balances', 'error');
    }
  };

  useEffect(() => {
    loadPayments();
    loadGuestBalances();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/payments`, {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString()
      });
      showMessage('Payment recorded successfully!');
      setFormData({
        guest_name: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setShowForm(false);
      loadPayments();
      loadGuestBalances();
    } catch (err) {
      showMessage('Failed to record payment', 'error');
    }
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/payments/${paymentId}`);
        console.log('Delete payment response:', response);
        showMessage('Payment deleted successfully!');
        loadPayments();
        loadGuestBalances();
      } catch (err) {
        console.error('Error deleting payment:', err);
        showMessage('Failed to delete payment', 'error');
      }
    }
  };

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const guestsWithDebt = guestBalances.filter(guest => guest.balance > 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">💳 Payments</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="pastel-button bg-pastel-green text-green-700 px-6 py-2 rounded-lg font-medium hover:bg-green-100"
        >
          {showForm ? 'Cancel' : '+ Record Payment'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-pastel-mint p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-700 mb-2">Total Payments Received</h3>
          <p className="text-3xl font-bold text-green-800">${totalPayments.toFixed(2)}</p>
        </div>
        <div className="bg-pastel-orange p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-700 mb-2">Guests with Outstanding Tabs</h3>
          <p className="text-3xl font-bold text-orange-800">{guestsWithDebt.length}</p>
        </div>
      </div>

      {/* Payment Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-pastel-blue bg-opacity-30 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">Record New Payment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name</label>
              <select
                value={formData.guest_name}
                onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                className="pastel-input w-full px-3 py-2 rounded-lg"
                required
              >
                <option value="">Select guest...</option>
                {guestsWithDebt.map((guest) => (
                  <option key={guest.guest_name} value={guest.guest_name}>
                    {guest.guest_name} (Owes: ${guest.balance.toFixed(2)})
                  </option>
                ))}
                <option value="other">Other (type name)</option>
              </select>
              {formData.guest_name === 'other' && (
                <input
                  type="text"
                  placeholder="Enter guest name"
                  onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                  className="pastel-input w-full px-3 py-2 rounded-lg mt-2"
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="pastel-input w-full px-3 py-2 rounded-lg"
                placeholder="e.g., 25.00"
                required
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="pastel-input w-full px-3 py-2 rounded-lg"
                placeholder="Payment method, reference, etc."
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="pastel-button bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600"
            >
              Record Payment
            </button>
          </div>
        </form>
      )}

      {/* Guest Balance Summary */}
      {guestsWithDebt.length > 0 && (
        <div className="bg-pastel-yellow bg-opacity-30 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-yellow-700 mb-4">📋 Quick Balance Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guestsWithDebt.slice(0, 6).map((guest) => (
              <div key={guest.guest_name} className="bg-white p-3 rounded-lg">
                <div className="font-medium text-gray-800">{guest.guest_name}</div>
                <div className="text-sm text-red-600">Owes: ${guest.balance.toFixed(2)}</div>
              </div>
            ))}
          </div>
          {guestsWithDebt.length > 6 && (
            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">
                ... and {guestsWithDebt.length - 6} more guests with outstanding tabs
              </span>
            </div>
          )}
        </div>
      )}

      {/* Payments History */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-pastel-mint border-b">
          <h3 className="text-lg font-semibold text-green-700">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-pastel-mint">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-pastel-mint hover:bg-opacity-20">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.guest_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleDelete(payment.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {payments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No payments recorded yet</div>
            <div className="text-gray-500 text-sm mt-2">
              Payment history will appear here once you start recording payments.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentsView;