import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Loader2, X, Mail, Phone, Wallet, Gift, ChevronLeft, ChevronRight, User } from 'lucide-react';

function Customers({ user, showToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', membership_level: 'standard' });

  useEffect(() => { loadCustomers(); }, [page, search]);

  const loadCustomers = async () => {
    setLoading(true);
    if (window.electronAPI) {
      const result = await window.electronAPI.getCustomers({ page, limit: 12, search });
      if (result.success) setCustomers(result.customers);
    } else {
      setCustomers([
        { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@email.com', phone: '+1234567890', membership_level: 'gold', wallet_balance: 150.00, loyalty_points: 2500 },
        { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@email.com', phone: '+1234567891', membership_level: 'silver', wallet_balance: 50.00, loyalty_points: 1200 },
        { id: '3', first_name: 'Bob', last_name: 'Wilson', email: 'bob@email.com', phone: '+1234567892', membership_level: 'standard', wallet_balance: 0, loyalty_points: 500 },
        { id: '4', first_name: 'Alice', last_name: 'Brown', email: 'alice@email.com', phone: '+1234567893', membership_level: 'gold', wallet_balance: 200.00, loyalty_points: 3500 },
      ]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (window.electronAPI) await window.electronAPI.createCustomer(formData);
    showToast('Customer created!', 'success');
    setShowModal(false);
    loadCustomers();
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage customer relationships and loyalty</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="card p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="input pl-12" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {customers.map((customer) => (
            <motion.div key={customer.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card p-5 card-hover">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-xl font-bold">
                  {customer.first_name?.[0]}{customer.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{customer.first_name} {customer.last_name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</p>
                </div>
                <span className={`badge ${customer.membership_level === 'gold' ? 'bg-amber-100 text-amber-700' : customer.membership_level === 'silver' ? 'bg-gray-200 text-gray-600' : 'badge-info'}`}>
                  {customer.membership_level}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(customer.wallet_balance || 0)}</p>
                  <p className="text-xs text-gray-500">Wallet</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-indigo-600">{customer.loyalty_points || 0}</p>
                  <p className="text-xs text-gray-500">Points</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-600">5</p>
                  <p className="text-xs text-gray-500">Visits</p>
                </div>
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
              <h3 className="text-xl font-bold">Add Customer</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">First Name *</label><input type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="input" required /></div>
                <div><label className="label">Last Name *</label><input type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="input" required /></div>
              </div>
              <div><label className="label">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="input" /></div>
              <div><label className="label">Phone *</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input" required /></div>
              <div><label className="label">Membership Level</label>
                <select value={formData.membership_level} onChange={(e) => setFormData({...formData, membership_level: e.target.value})} className="select">
                  <option value="standard">Standard</option><option value="silver">Silver</option><option value="gold">Gold</option>
                </select>
              </div>
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

export default Customers;
