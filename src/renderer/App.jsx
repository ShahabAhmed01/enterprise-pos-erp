import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { Splash } from './pages/MorePages';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import Accounts from './pages/Accounts';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { Categories, Brands, Transfers, Returns, Notifications, ActivityLogs } from './pages/MorePages';
import Suppliers from './pages/Suppliers';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Toast from './components/Toast';
import Sales from './pages/Sales';

export const AppContext = createContext();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onMenuAction(handleMenuAction);
      window.electronAPI.onNavigate(handleNavigate);
    }
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('menu-action');
        window.electronAPI.removeAllListeners('navigate');
      }
    };
  }, []);

  const handleMenuAction = (action) => {
    switch (action) {
      case 'settings': setCurrentPage('settings'); break;
      case 'new-sale': setCurrentPage('pos'); break;
      case 'backup': showToast('Backup initiated', 'info'); break;
      case 'about': showToast('Enterprise POS ERP v1.0.0', 'info'); break;
      default: break;
    }
  };

  const handleNavigate = (path) => {
    if (!path || path === '/') {
      setCurrentPage('dashboard');
      return;
    }
    setCurrentPage(path.startsWith('/') ? path.slice(1) : path);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const renderPage = () => {
    const props = { user, showToast, setCurrentPage };
    
    switch (currentPage) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'pos': return <POS {...props} />;
      case 'products': return <Products {...props} />;
      case 'categories': return <Categories {...props} />;
      case 'brands': return <Brands {...props} />;
      case 'inventory': return <Inventory {...props} />;
      case 'transfers': return <Transfers {...props} />;
      case 'sales': return <Sales {...props} />;
      case 'customers': return <Customers {...props} />;
      case 'suppliers': return <Suppliers {...props} />;
      case 'purchases': return <Purchases {...props} />;
      case 'returns': return <Returns {...props} />;
      case 'accounts': return <Accounts {...props} />;
      case 'expenses': return <Expenses {...props} />;
      case 'employees': return <Employees {...props} />;
      case 'reports': return <Reports {...props} />;
      case 'settings': return <Settings {...props} />;
      case 'notifications': return <Notifications {...props} />;
      case 'activity': return <ActivityLogs {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  if (isLoading) {
    return <Splash />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} showToast={showToast} />;
  }

  return (
    <ErrorBoundary>
    <AppContext.Provider value={{ user, theme, setTheme, showToast }}>
      <div className={`flex h-screen bg-gray-50 ${theme === 'dark' ? 'dark' : ''}`}>
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          user={user}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            user={user}
            onLogout={handleLogout}
            setCurrentPage={setCurrentPage}
          />
          
          <main className="flex-1 overflow-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        
        <AnimatePresence>
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </AppContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
