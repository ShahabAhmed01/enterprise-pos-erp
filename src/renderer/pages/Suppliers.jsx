import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Truck, Phone, Mail, MapPin, Loader2, X } from 'lucide-react';

export function Suppliers({ user, showToast }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '', address: '' });

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    if (window.electronAPI) {
      const result = await window.electronAPI.getSuppliers({ page: 1, limit: 50 });
      if (result.success) setSuppliers(result.suppliers);
    } else {
      setSuppliers([
        { id: '1', name: 'Global Distributors', company: 'Global Corp', email: 'orders@global.com', phone: '+1987654321', address: '123 Supply St' },
        { id: '2', name: 'Tech Supplies Inc', company: 'TechSupplies', email: 'sales@techsupplies.com', phone: '+1987654322', address: '456 Tech Ave' },
      ]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (window.electronAPI) await window.electronAPI.createSupplier(formData);
    showToast('Supplier created!', 'success');
    setShowModal(false);
    loadSuppliers();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Suppliers</h1><p className="text-gray-500">Manage your suppliers and vendors</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Supplier</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((supplier) => (
            <motion.div key={supplier.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl"><Truck className="w-7 h-7" /></div>
                <div><h3 className="font-semibold text-gray-900">{supplier.name}</h3><p className="text-sm text-gray-500">{supplier.company}</p></div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" /> {supplier.email}</p>
                <p className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" /> {supplier.phone}</p>
                <p className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4" /> {supplier.address}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="modal w-[500px]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">Add Supplier</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="label">Supplier Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input" required /></div>
              <div><label className="label">Company</label><input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="input" /></div>
              <div><label className="label">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="input" /></div>
              <div><label className="label">Phone *</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input" required /></div>
              <div><label className="label">Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="input" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-outline">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Create</button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
export default Suppliers;
