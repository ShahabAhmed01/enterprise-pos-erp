import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, Wallet } from 'lucide-react';

export function Accounts({ user, showToast }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    setLoading(true);
    if (window.electronAPI) {
      const result = await window.electronAPI.getAccounts({});
      if (result.success) setAccounts(result.accounts);
    } else {
      setAccounts([
        { id: '1', account_number: '1000', name: 'Cash', type: 'asset', current_balance: 15000 },
        { id: '2', account_number: '1100', name: 'Bank Accounts', type: 'asset', current_balance: 45000 },
      ]);
    }
    setLoading(false);
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Accounts</h1><p className="text-gray-500">Chart of accounts and ledger</p></div>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Account</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="card p-5"><p className="text-sm text-gray-500">Total Assets</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(accounts.filter(a => a.type === 'asset').reduce((s, a) => s + a.current_balance, 0))}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Total Liabilities</p><p className="text-xl font-bold text-red-600">{formatCurrency(accounts.filter(a => a.type === 'liability').reduce((s, a) => s + a.current_balance, 0))}</p></div>
      </div>
      {loading ? <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div> : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Account #</th><th>Account Name</th><th>Type</th><th>Balance</th></tr></thead>
            <tbody>{accounts.map((account) => (
              <tr key={account.id}>
                <td className="font-mono">{account.account_number}</td>
                <td>{account.name}</td>
                <td><span className="badge badge-info">{account.type}</span></td>
                <td className="font-semibold">{formatCurrency(account.current_balance)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
export default Accounts;