import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, ShoppingCart } from 'lucide-react';

export function Purchases({ user, showToast }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPurchases(); }, []);

  const loadPurchases = async () => {
    setLoading(true);
    if (window.electronAPI) {
      // Load purchases
    }
    setPurchases([
      { id: '1', reference: 'PO001', supplier_name: 'Global Distributors', grand_total: 2500.00, status: 'received', purchase_date: new Date().toISOString() },
    ]);
    setLoading(false);
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Purchases</h1><p className="text-gray-500">Manage purchase orders and goods receiving</p></div>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Purchase Order</button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Reference</th><th>Supplier</th><th>Date</th><th>Status</th><th>Amount</th></tr></thead>
            <tbody>
              {purchases.map((po) => (
                <tr key={po.id}>
                  <td className="font-medium">{po.reference}</td>
                  <td>{po.supplier_name}</td>
                  <td>{new Date(po.purchase_date).toLocaleDateString()}</td>
                  <td><span className={`badge ${po.status === 'received' ? 'badge-success' : 'badge-warning'}`}>{po.status}</span></td>
                  <td className="font-semibold">{formatCurrency(po.grand_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
export default Purchases;
