import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, UserPlus } from 'lucide-react';

export function Employees({ user, showToast }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    setLoading(true);
    if (window.electronAPI) {
      const result = await window.electronAPI.getEmployees({ page: 1, limit: 50 });
      if (result.success) setEmployees(result.employees);
    } else {
      setEmployees([
        { id: '1', first_name: 'Sarah', last_name: 'Johnson', employee_code: 'EMP001', designation: 'Store Manager', department: 'Operations', email: 'sarah@company.com', phone: '+1234567891', is_active: 1 },
        { id: '2', first_name: 'Mike', last_name: 'Williams', employee_code: 'EMP002', designation: 'Sales Associate', department: 'Sales', email: 'mike@company.com', phone: '+1234567892', is_active: 1 },
      ]);
    }
    setLoading(false);
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
      </div>
      {loading ? <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div> : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Employee</th><th>Code</th><th>Designation</th><th>Department</th><th>Status</th></tr></thead>
            <tbody>{employees.map((emp) => (
              <tr key={emp.id}>
                <td className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-semibold">{emp.first_name?.[0]}{emp.last_name?.[0]}</div>
                  <span className="font-medium">{emp.first_name} {emp.last_name}</span>
                </td>
                <td className="font-mono">{emp.employee_code}</td>
                <td>{emp.designation}</td>
                <td>{emp.department}</td>
                <td><span className={`badge ${emp.is_active ? 'badge-success' : 'badge-gray'}`}>{emp.is_active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
export default Employees;