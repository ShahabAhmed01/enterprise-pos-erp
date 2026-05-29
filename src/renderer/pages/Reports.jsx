import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Loader2, BarChart3, ShoppingBag, Users, Building2, Settings } from 'lucide-react';

export function Reports({ user, showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    if (window.electronAPI) {
      const result = await window.electronAPI.getCategories();
      if (result.success) setItems(result.categories || []);
    } else {
      setItems([
        { id: '1', name: 'Sample Item 1', description: 'Description here' },
        { id: '2', name: 'Sample Item 2', description: 'Description here' },
      ]);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PAGE_TITLE</h1>
          <p className="text-gray-500">Manage your PAGE_TITLE</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card p-5">
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.description || 'No description'}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
export default Reports;
