import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Loader2, X, ChevronLeft, ChevronRight, Truck, Phone, Mail, MapPin, DollarSign, Calendar, Download, Edit2, Eye, Bell, Activity } from 'lucide-react';

// ==================== SUPPLIERS ====================
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
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl">
                  <Truck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                  <p className="text-sm text-gray-500">{supplier.company}</p>
                </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
        </div>
      )}
    </motion.div>
  );
}

// ==================== INVENTORY ====================
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

// ==================== PURCHASES ====================
export function Purchases({ user, showToast }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Purchases</h1><p className="text-gray-500">Manage purchase orders and GRN</p></div>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Purchase</button>
      </div>
      <div className="card p-12 text-center">
        <p className="text-gray-500">Purchase management module - create and track purchase orders</p>
      </div>
    </motion.div>
  );
}

// ==================== EXPENSES ====================
export function Expenses({ user, showToast }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    setLoading(true);
    setExpenses([
      { id: '1', category: 'Rent', amount: 2500, description: 'Monthly office rent', date: new Date().toISOString(), vendor: 'Landlord Inc' },
      { id: '2', category: 'Utilities', amount: 450, description: 'Electricity bill', date: new Date().toISOString(), vendor: 'Power Corp' },
      { id: '3', category: 'Supplies', amount: 850, description: 'Office supplies', date: new Date().toISOString(), vendor: 'Office Depot' },
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

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Vendor</th><th>Amount</th></tr></thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td><span className="badge badge-info">{expense.category}</span></td>
                  <td>{expense.description}</td>
                  <td>{expense.vendor}</td>
                  <td className="font-semibold text-red-600">{formatCurrency(expense.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

// ==================== ACCOUNTS ====================
export function Accounts({ user, showToast }) {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.getAccounts({});
      if (result.success) setAccounts(result.accounts);
    } else {
      setAccounts([
        { id: '1', account_number: '1000', name: 'Cash', type: 'asset', current_balance: 15000 },
        { id: '2', account_number: '1100', name: 'Bank Accounts', type: 'asset', current_balance: 45000 },
        { id: '3', account_number: '1200', name: 'Accounts Receivable', type: 'asset', current_balance: 8500 },
        { id: '4', account_number: '2000', name: 'Accounts Payable', type: 'liability', current_balance: 12000 },
        { id: '5', account_number: '3000', name: 'Sales Revenue', type: 'revenue', current_balance: 125000 },
        { id: '6', account_number: '4000', name: 'Cost of Goods Sold', type: 'expense', current_balance: 75000 },
      ]);
    }
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
        <div className="card p-5"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-xl font-bold text-indigo-600">{formatCurrency(accounts.filter(a => a.type === 'revenue').reduce((s, a) => s + a.current_balance, 0))}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Total Expenses</p><p className="text-xl font-bold text-amber-600">{formatCurrency(accounts.filter(a => a.type === 'expense').reduce((s, a) => s + a.current_balance, 0))}</p></div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Account #</th><th>Account Name</th><th>Type</th><th>Balance</th></tr></thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td className="font-mono font-medium">{account.account_number}</td>
                <td>{account.name}</td>
                <td><span className={`badge ${account.type === 'asset' ? 'badge-success' : account.type === 'liability' ? 'badge-danger' : account.type === 'revenue' ? 'badge-info' : 'badge-warning'}`}>{account.type}</span></td>
                <td className="font-semibold">{formatCurrency(account.current_balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ==================== EMPLOYEES ====================
export function Employees({ user, showToast }) {
  const [employees, setEmployees] = useState([]);

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.getEmployees({ page: 1, limit: 50 });
      if (result.success) setEmployees(result.employees);
    } else {
      setEmployees([
        { id: '1', first_name: 'Sarah', last_name: 'Johnson', employee_code: 'EMP001', designation: 'Store Manager', department: 'Operations', email: 'sarah@company.com', phone: '+1234567891', is_active: 1 },
        { id: '2', first_name: 'Mike', last_name: 'Williams', employee_code: 'EMP002', designation: 'Sales Associate', department: 'Sales', email: 'mike@company.com', phone: '+1234567892', is_active: 1 },
        { id: '3', first_name: 'Emily', last_name: 'Brown', employee_code: 'EMP003', designation: 'Cashier', department: 'Sales', email: 'emily@company.com', phone: '+1234567893', is_active: 1 },
      ]);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Employees</h1><p className="text-gray-500">Staff management and HR</p></div>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Employee</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5"><p className="text-2xl font-bold text-gray-900">{employees.length}</p><p className="text-sm text-gray-500">Total Employees</p></div>
        <div className="card p-5"><p className="text-2xl font-bold text-emerald-600">{employees.filter(e => e.is_active).length}</p><p className="text-sm text-gray-500">Active</p></div>
        <div className="card p-5"><p className="text-2xl font-bold text-gray-900">{employees.filter(e => !e.is_active).length}</p><p className="text-sm text-gray-500">Inactive</p></div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Employee</th><th>Code</th><th>Designation</th><th>Department</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-semibold">{emp.first_name?.[0]}{emp.last_name?.[0]}</div>
                  <span className="font-medium">{emp.first_name} {emp.last_name}</span>
                </td>
                <td className="font-mono">{emp.employee_code}</td>
                <td>{emp.designation}</td>
                <td>{emp.department}</td>
                <td>{emp.email}</td>
                <td>{emp.phone}</td>
                <td><span className={`badge ${emp.is_active ? 'badge-success' : 'badge-gray'}`}>{emp.is_active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ==================== REPORTS ====================
export function Reports({ user, showToast }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Reports</h1><p className="text-gray-500">Business analytics and insights</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {['Sales Report', 'Profit & Loss', 'Inventory Report', 'Customer Report', 'Employee Report', 'Tax Report'].map((report, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card p-5 card-hover cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900">{report}</h3>
            <p className="text-sm text-gray-500 mt-1">Generate and export {report.toLowerCase()}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ==================== SETTINGS ====================
export function Settings({ user, showToast }) {
  const [settings, setSettings] = useState({
    business_name: 'Enterprise POS',
    business_email: 'info@enterprise-pos.com',
    business_phone: '+1 234 567 8900',
    tax_rate: '10',
    currency: 'USD',
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-gray-500">Configure your business settings</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Business Name</label><input type="text" value={settings.business_name} onChange={(e) => setSettings({...settings, business_name: e.target.value})} className="input" /></div>
              <div><label className="label">Email</label><input type="email" value={settings.business_email} onChange={(e) => setSettings({...settings, business_email: e.target.value})} className="input" /></div>
              <div><label className="label">Phone</label><input type="tel" value={settings.business_phone} onChange={(e) => setSettings({...settings, business_phone: e.target.value})} className="input" /></div>
              <div><label className="label">Currency</label><select value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})} className="select"><option>USD</option><option>EUR</option><option>GBP</option></select></div>
              <div><label className="label">Tax Rate (%)</label><input type="number" value={settings.tax_rate} onChange={(e) => setSettings({...settings, tax_rate: e.target.value})} className="input" /></div>
            </div>
            <button onClick={() => showToast('Settings saved!', 'success')} className="btn-primary mt-6">Save Changes</button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between"><span>Auto Backup</span><input type="checkbox" defaultChecked className="checkbox" /></label>
              <label className="flex items-center justify-between"><span>Low Stock Alerts</span><input type="checkbox" defaultChecked className="checkbox" /></label>
              <label className="flex items-center justify-between"><span>Print Receipt</span><input type="checkbox" defaultChecked className="checkbox" /></label>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==================== REMAINING PAGES ====================
export function Categories({ user, showToast }) {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getCategories().then(r => r.success && setCategories(r.categories));
    } else {
      setCategories([
        { id: '1', name: 'Electronics', description: 'Electronic devices', product_count: 45 },
        { id: '2', name: 'Groceries', description: 'Food and household', product_count: 120 },
        { id: '3', name: 'Fashion', description: 'Clothing and accessories', product_count: 85 },
        { id: '4', name: 'Home & Garden', description: 'Home improvement', product_count: 60 },
      ]);
    }
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Categories</h1><p className="text-gray-500">Product categories management</p></div>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Category</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((cat) => (
          <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card p-5">
            <h3 className="font-semibold text-gray-900">{cat.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
            <p className="text-sm text-gray-400 mt-2">{cat.product_count || 0} products</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function Brands({ user, showToast }) {
  const [brands, setBrands] = useState([]);
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getBrands().then(r => r.success && setBrands(r.brands));
    } else {
      setBrands([
        { id: '1', name: 'Apple', description: 'Apple Inc.', product_count: 25 },
        { id: '2', name: 'Samsung', description: 'Samsung Electronics', product_count: 30 },
        { id: '3', name: 'Nike', description: 'Nike Inc.', product_count: 45 },
        { id: '4', name: 'Sony', description: 'Sony Corporation', product_count: 20 },
      ]);
    }
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Brands</h1><p className="text-gray-500">Brand management</p></div>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Brand</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {brands.map((brand) => (
          <motion.div key={brand.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card p-5">
            <h3 className="font-semibold text-gray-900">{brand.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{brand.description}</p>
            <p className="text-sm text-gray-400 mt-2">{brand.product_count || 0} products</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function Transfers({ user, showToast }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1><p className="text-gray-500">Transfer stock between warehouses</p></div>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Transfer</button>
      </div>
      <div className="card p-12 text-center"><p className="text-gray-500">Stock transfer management module</p></div>
    </motion.div>
  );
}

export function Returns({ user, showToast }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Returns</h1><p className="text-gray-500">Manage sales and purchase returns</p></div>
      </div>
      <div className="card p-12 text-center"><p className="text-gray-500">Returns management module</p></div>
    </motion.div>
  );
}

export function Notifications({ user, showToast }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.getNotifications({});
        if (result.success) setNotifications(result.notifications || []);
      } else {
        setNotifications([
          { id: '1', type: 'stock_alert', title: 'Low Stock Alert', message: 'Nike Air Max 270 stock is below threshold.', is_read: 0, created_at: new Date().toISOString() },
          { id: '2', type: 'system', title: 'Backup Complete', message: 'System backup completed successfully.', is_read: 0, created_at: new Date().toISOString() },
          { id: '3', type: 'customer', title: 'New Customer', message: 'Ahmed Khan registered as customer.', is_read: 1, created_at: new Date(Date.now() - 86400000).toISOString() },
        ]);
      }
    } catch (e) { showToast('Failed to load notifications', 'error'); }
    setLoading(false);
  };

  const handleMarkRead = async (notifId) => {
    if (window.electronAPI) {
      await window.electronAPI.markNotificationRead({ id: notifId });
    }
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: 1 } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">System notifications and alerts</p>
        </div>
        {unreadCount > 0 && <span className="badge badge-danger">{unreadCount} unread</span>}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center"><Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No notifications</p></div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`card p-4 flex items-start gap-4 cursor-pointer transition-colors ${!notif.is_read ? 'border-l-4 border-l-red-500 bg-red-50/50' : 'hover:bg-gray-50'}`}
              onClick={() => !notif.is_read && handleMarkRead(notif.id)}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.type === 'stock_alert' ? 'bg-amber-100 text-amber-600' : notif.type === 'system' ? 'bg-blue-100 text-blue-600' : notif.type === 'customer' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
              </div>
              {!notif.is_read && <span className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function ActivityLogs({ user, showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.getActivityLogs({ page: 1, limit: 50 });
        if (result.success) setLogs(result.logs || []);
      } else {
        setLogs([
          { id: '1', action: 'User Login', entity_type: 'users', created_at: new Date().toISOString(), user_name: 'Admin' },
          { id: '2', action: 'Sale Completed', entity_type: 'sales', created_at: new Date(Date.now() - 3600000).toISOString(), user_name: 'Cashier' },
          { id: '3', action: 'Product Added', entity_type: 'products', created_at: new Date(Date.now() - 7200000).toISOString(), user_name: 'Manager' },
        ]);
      }
    } catch (e) { showToast('Failed to load activity logs', 'error'); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1><p className="text-gray-500">System activity and audit trail</p></div>
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
      ) : logs.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-gray-500">No activity logs yet</p></div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{log.action}</p>
                <p className="text-sm text-gray-500">{log.entity_type} • {log.user_name || 'System'}</p>
              </div>
              <p className="text-sm text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function Splash() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-500 via-rose-600 to-purple-700 flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
          <span className="text-5xl">🏪</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Enterprise POS</h1>
        <p className="text-white/70 text-lg">Loading application...</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="h-full bg-white rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
