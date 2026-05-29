import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';

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
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Business Name</label><input type="text" value={settings.business_name} onChange={(e) => setSettings({...settings, business_name: e.target.value})} className="input" /></div>
              <div><label className="label">Email</label><input type="email" value={settings.business_email} onChange={(e) => setSettings({...settings, business_email: e.target.value})} className="input" /></div>
              <div><label className="label">Phone</label><input type="tel" value={settings.business_phone} onChange={(e) => setSettings({...settings, business_phone: e.target.value})} className="input" /></div>
              <div><label className="label">Currency</label><select value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})} className="select"><option>USD</option><option>EUR</option><option>GBP</option></select></div>
              <div><label className="label">Tax Rate (%)</label><input type="number" value={settings.tax_rate} onChange={(e) => setSettings({...settings, tax_rate: e.target.value})} className="input" /></div>
            </div>
            <button onClick={() => showToast('Settings saved!', 'success')} className="btn-primary mt-6 flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
          </div>
        </div>
        <div>
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
export default Settings;
