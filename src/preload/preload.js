import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Authentication
  login: (data) => ipcRenderer.invoke('auth:login', data),
  pinLogin: (data) => ipcRenderer.invoke('auth:pin-login', data),
  logout: (data) => ipcRenderer.invoke('auth:logout', data),
  getCurrentUser: (data) => ipcRenderer.invoke('auth:get-current-user', data),

  // Dashboard
  getDashboardStats: (data) => ipcRenderer.invoke('dashboard:get-stats', data),

  // Products
  getProducts: (data) => ipcRenderer.invoke('products:get-all', data),
  createProduct: (data) => ipcRenderer.invoke('products:create', data),
  updateProduct: (data) => ipcRenderer.invoke('products:update', data),
  deleteProduct: (data) => ipcRenderer.invoke('products:delete', data),
  searchProducts: (data) => ipcRenderer.invoke('products:search', data),

  // Sales
  createSale: (data) => ipcRenderer.invoke('sales:create', data),
  getSales: (data) => ipcRenderer.invoke('sales:get-all', data),
  getSaleById: (data) => ipcRenderer.invoke('sales:get-by-id', data),

  // Customers
  getCustomers: (data) => ipcRenderer.invoke('customers:get-all', data),
  createCustomer: (data) => ipcRenderer.invoke('customers:create', data),
  updateCustomerWallet: (data) => ipcRenderer.invoke('customers:update-wallet', data),

  // Suppliers
  getSuppliers: (data) => ipcRenderer.invoke('suppliers:get-all', data),
  createSupplier: (data) => ipcRenderer.invoke('suppliers:create', data),

  // Purchases
  createPurchase: (data) => ipcRenderer.invoke('purchases:create', data),

  // Inventory
  getStock: (data) => ipcRenderer.invoke('inventory:get-stock', data),
  adjustStock: (data) => ipcRenderer.invoke('inventory:adjust-stock', data),
  transferStock: (data) => ipcRenderer.invoke('inventory:transfer', data),

  // Accounts
  getAccounts: (data) => ipcRenderer.invoke('accounts:get-all', data),
  createExpense: (data) => ipcRenderer.invoke('expenses:create', data),
  createTransaction: (data) => ipcRenderer.invoke('transactions:create', data),

  // Employees
  getEmployees: (data) => ipcRenderer.invoke('employees:get-all', data),
  markAttendance: (data) => ipcRenderer.invoke('attendance:mark', data),

  // Categories, Brands, Warehouses, Units
  getCategories: () => ipcRenderer.invoke('categories:get-all'),
  getBrands: () => ipcRenderer.invoke('brands:get-all'),
  getWarehouses: () => ipcRenderer.invoke('warehouses:get-all'),
  getUnits: () => ipcRenderer.invoke('units:get-all'),

  // Reports
  getSalesReport: (data) => ipcRenderer.invoke('reports:sales', data),
  getProfitLossReport: (data) => ipcRenderer.invoke('reports:profit-loss', data),

  // Settings
  getSettings: (data) => ipcRenderer.invoke('settings:get', data),
  setSetting: (data) => ipcRenderer.invoke('settings:set', data),

  // Returns
  createSaleReturn: (data) => ipcRenderer.invoke('returns:create-sale-return', data),

  // Held Orders
  holdOrder: (data) => ipcRenderer.invoke('orders:hold', data),
  getHeldOrders: (data) => ipcRenderer.invoke('orders:get-held', data),
  recallHeldOrder: (data) => ipcRenderer.invoke('orders:recall-held', data),

  // Notifications
  getNotifications: (data) => ipcRenderer.invoke('notifications:get', data),
  markNotificationRead: (data) => ipcRenderer.invoke('notifications:mark-read', data),
  createNotification: (data) => ipcRenderer.invoke('notifications:create', data),

  // Activity Logs
  getActivityLogs: (data) => ipcRenderer.invoke('logs:get-activity', data),

  // File Dialogs
  openFileDialog: (options) => ipcRenderer.invoke('dialog:open-file', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:save-file', options),

  // Shell
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),

  // App Info
  getAppPath: (name) => ipcRenderer.invoke('app:get-path', name),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),

  // Event Listeners
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action)),
  onNavigate: (callback) => ipcRenderer.on('navigate', (event, path) => callback(path)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
