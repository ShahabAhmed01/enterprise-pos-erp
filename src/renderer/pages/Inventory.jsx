import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function Inventory({ user, showToast }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStock(); }, []);

  const loadStock = async () => {
    setLoading(true);
    if (window.electronAPI) {
      const result = await window.electronAPI.getStock({ page: 1, limit: 100 });
      if (result.success) setStock(result.stock);
    } else {
      setStock([
        { id: '1', name: 'Wireless Headphones', sku: 'ELEC001', quantity: 50, cost_price: 45.00, selling_price: 89.99, min_stock_level: 10, warehouse_name: 'Main Warehouse', stock_value: 2250 },
        { id: '2', name: 'USB-C Cable', sku: 'ELEC002', quantity: 100, cost_price: 5.00, selling_price: 15.99, min_stock_level: 20, warehouse_name: 'Main Warehouse', stock_value: 500 },
        { id: '3', name: 'Smart Watch Pro', sku: 'ELEC003', quantity: 5, cost_price: 120.00, selling_price: 249.99, min_stock_level: 10, warehouse_name: 'Main Warehouse', stock_value: 600 },
      ]);
    }
    setLoading(false);
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Inventory</h1><p className="text-gray-500">Track stock levels across warehouses</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="card p-5"><p className="text-2xl font-bold text-gray-900">{stock.reduce((s, i) => s + i.quantity, 0)}</p><p className="text-sm text-gray-500">Total Items</p></div>
        <div className="card p-5"><p className="text-2xl font-bold text-emerald-600">{formatCurrency(stock.reduce((s, i) => s + (i.stock_value || 0), 0))}</p><p className="text-sm text-gray-500">Stock Value</p></div>
        <div className="card p-5"><p className="text-2xl font-bold text-amber-600">{stock.filter(i => i.quantity <= i.min_stock_level).length}</p><p className="text-sm text-gray-500">Low Stock Items</p></div>
        <div className="card p-5"><p className="text-2xl font-bold text-indigo-600">{stock.length}</p><p className="text-sm text-gray-500">Products</p></div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Product</th><th>SKU</th><th>Warehouse</th><th>Quantity</th><th>Min Level</th><th>Cost</th><th>Value</th><th>Status</th></tr></thead>
            <tbody>
              {stock.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium">{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.warehouse_name}</td>
                  <td className="font-semibold">{item.quantity}</td>
                  <td>{item.min_stock_level}</td>
                  <td>{formatCurrency(item.cost_price)}</td>
                  <td>{formatCurrency(item.stock_value || 0)}</td>
                  <td><span className={`badge ${item.quantity <= 0 ? 'badge-danger' : item.quantity <= item.min_stock_level ? 'badge-warning' : 'badge-success'}`}>{item.quantity <= 0 ? 'Out of Stock' : item.quantity <= item.min_stock_level ? 'Low Stock' : 'In Stock'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
export default Inventory;
