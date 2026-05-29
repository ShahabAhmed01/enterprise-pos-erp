import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';

export function Expenses({ user, showToast }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    setLoading(true);
    setExpenses([
      { id: '1', category: 'Rent', amount: 2500, description: 'Monthly office rent', vendor: 'Landlord Inc' },
      { id: '2', category: 'Utilities', amount: 450, description: 'Electricity bill', vendor: 'Power Corp' },
    ]);
    setLoading(false);
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Expenses</h1><p className="text-gray-500">Track business expenses</p></div>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Expense</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5"><p className="text-2xl font-bold text-gray-900">{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}</p><p className="text-sm text-gray-500">Total Expenses</p></div>
      </div>
      {loading ? <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div> : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Category</th><th>Description</th><th>Vendor</th><th>Amount</th></tr></thead>
            <tbody>{expenses.map((expense) => (
              <tr key={expense.id}>
                <td><span className="badge badge-info">{expense.category}</span></td>
                <td>{expense.description}</td>
                <td>{expense.vendor}</td>
                <td className="font-semibold text-red-600">{formatCurrency(expense.amount)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
export default Expenses;