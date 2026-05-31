import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingCart, Package, Box, ArrowLeftRight, 
  Users, UserPlus, Building2, Truck, FileText, Receipt, 
  Wallet, PieChart, BarChart3, Settings, LogOut, ChevronLeft,
  ChevronRight, Tags, Factory, ClipboardList, AlertTriangle,
  Calculator, Calendar, Shield, Activity, Bell
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'Point of Sale', icon: ShoppingCart, highlight: true },
  { id: 'sales', label: 'Sales', icon: Receipt },
  { id: 'returns', label: 'Returns', icon: ArrowLeftRight },
];

const inventoryItems = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'brands', label: 'Brands', icon: Factory },
  { id: 'inventory', label: 'Inventory', icon: Box },
  { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
];

const peopleItems = [
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'employees', label: 'Employees', icon: UserPlus },
];

const financeItems = [
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'expenses', label: 'Expenses', icon: Calculator },
  { id: 'purchases', label: 'Purchases', icon: ClipboardList },
];

const reportsItems = [
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'activity', label: 'Activity Logs', icon: Activity },
];

const settingsItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

function Sidebar({ currentPage, setCurrentPage, collapsed, setCollapsed, user }) {
  const role = user?.role || '';
  const isSuperAdmin = role === 'Super Admin';
  const isManager = role === 'Manager' || role === 'Branch Manager';
  const isCashier = role === 'Cashier';

  const menuItems = [
    ...(isSuperAdmin || isManager ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart, highlight: true },
    ...(isSuperAdmin || isManager ? [
      { id: 'sales', label: 'Sales', icon: Receipt },
      { id: 'returns', label: 'Returns', icon: ArrowLeftRight },
    ] : isCashier ? [
      { id: 'sales', label: 'My Sales', icon: Receipt },
      { id: 'returns', label: 'Returns', icon: ArrowLeftRight },
    ] : []),
  ];

  const inventoryItems = isSuperAdmin ? [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'brands', label: 'Brands', icon: Factory },
    { id: 'inventory', label: 'Inventory', icon: Box },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  ] : isManager ? [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'brands', label: 'Brands', icon: Factory },
    { id: 'inventory', label: 'Inventory', icon: Box },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  ] : [];

  const peopleItems = isSuperAdmin ? [
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'employees', label: 'Employees', icon: UserPlus },
  ] : isManager ? [
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'employees', label: 'Employees', icon: UserPlus },
  ] : isCashier ? [
    { id: 'customers', label: 'Customers', icon: Users },
  ] : [];

  const financeItems = isSuperAdmin ? [
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'expenses', label: 'Expenses', icon: Calculator },
    { id: 'purchases', label: 'Purchases', icon: ClipboardList },
  ] : isManager ? [
    { id: 'expenses', label: 'Expenses', icon: Calculator },
    { id: 'purchases', label: 'Purchases', icon: ClipboardList },
  ] : [];

  const reportsItems = (isSuperAdmin || isManager) ? [
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    ...(isSuperAdmin ? [{ id: 'activity', label: 'Activity Logs', icon: Activity }] : []),
  ] : [];

  const settingsItems = isSuperAdmin ? [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] : [];

  const MenuSection = ({ title, items }) => {
    if (!items || items.length === 0) return null;
    return (
    <div className="mb-4">
      {!collapsed && (
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' 
                  : item.highlight
                    ? 'bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-600 hover:from-red-500/20 hover:to-rose-500/20'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="bg-white border-r border-gray-200 flex flex-col h-full"
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-gray-100 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
          <span className="text-white text-xl">🏪</span>
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-bold text-gray-900">Enterprise</h1>
            <p className="text-xs text-gray-500">POS ERP System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <MenuSection title="Main" items={menuItems} />
        <MenuSection title="Inventory" items={inventoryItems} />
        <MenuSection title="People" items={peopleItems} />
        <MenuSection title="Finance" items={financeItems} />
        <MenuSection title="Reports" items={reportsItems} />
        <MenuSection title="System" items={settingsItems} />
      </nav>

      {/* User Info & Collapse */}
      <div className="border-t border-gray-100 p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-gray-50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-semibold">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
