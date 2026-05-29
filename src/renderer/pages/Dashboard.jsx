import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Clock, RefreshCw,
  ArrowRight, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

function Dashboard({ user, showToast, setCurrentPage }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');

  useEffect(() => {
    loadDashboardStats();
  }, [timeRange]);

  const loadDashboardStats = async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.getDashboardStats({ dateRange: timeRange });
        if (result.success) {
          setStats(result.stats);
        }
      } else {
        // Demo data for browser testing
        setStats({
          todaySales: 15420.50,
          todayOrders: 42,
          weekSales: 89500.00,
          monthSales: 342180.75,
          monthOrders: 856,
          profit: 4520.30,
          lowStock: 8,
          newCustomers: 12,
          expenses: 12500.00,
          recentSales: [
            { id: '1', reference: 'INV001', grand_total: 245.99, status: 'completed', created_at: new Date().toISOString(), user_name: 'Sarah Johnson' },
            { id: '2', reference: 'INV002', grand_total: 89.50, status: 'completed', created_at: new Date().toISOString(), user_name: 'Mike Williams' },
            { id: '3', reference: 'INV003', grand_total: 432.00, status: 'completed', created_at: new Date().toISOString(), user_name: 'Emily Brown' },
          ],
          topProducts: [
            { product_name: 'Wireless Headphones', total_qty: 156, total_sales: 14040 },
            { product_name: 'Smart Watch Pro', total_qty: 89, total_sales: 22249 },
            { product_name: 'Running Shoes', total_qty: 67, total_sales: 8709 },
          ],
          dailySales: [
            { date: 'Mon', total: 12500 },
            { date: 'Tue', total: 15800 },
            { date: 'Wed', total: 14200 },
            { date: 'Thu', total: 18900 },
            { date: 'Fri', total: 21500 },
            { date: 'Sat', total: 24800 },
            { date: 'Sun', total: 18900 },
          ]
        });
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const salesChartData = {
    labels: stats?.dailySales?.map(d => d.date) || [],
    datasets: [{
      label: 'Sales',
      data: stats?.dailySales?.map(d => d.total) || [],
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };

  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => formatCurrency(context.raw)
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280' }
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          color: '#6b7280',
          callback: (value) => '$' + (value / 1000) + 'k'
        }
      }
    }
  };

  const profitChartData = {
    labels: ['Sales', 'COGS', 'Expenses', 'Profit'],
    datasets: [{
      data: [stats?.monthSales || 100, 65, 15, 20],
      backgroundColor: ['#ef4444', '#6b7280', '#f59e0b', '#10b981'],
      borderWidth: 0,
    }]
  };

  const profitChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 20 }
      }
    },
    cutout: '65%'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.firstName}! Here's your business overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="select text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button onClick={loadDashboardStats} className="btn-ghost p-2">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div variants={itemVariants} className="card p-5">
          <div className="flex items-center justify-between">
            <div className="stat-icon bg-red-100 text-red-600">$</div>
            <span className="badge badge-success">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.todaySales || 0)}</p>
            <p className="text-sm text-gray-500">Today's Sales</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card p-5">
          <div className="flex items-center justify-between">
            <div className="stat-icon bg-indigo-100 text-indigo-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="badge badge-success">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8.2%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{stats?.todayOrders || 0}</p>
            <p className="text-sm text-gray-500">Orders Today</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card p-5">
          <div className="flex items-center justify-between">
            <div className="stat-icon bg-emerald-100 text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="badge badge-success">
              <TrendingUp className="w-3 h-3 mr-1" />
              +15.3%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.profit || 0)}</p>
            <p className="text-sm text-gray-500">Today's Profit</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card p-5">
          <div className="flex items-center justify-between">
            <div className="stat-icon bg-amber-100 text-amber-600">
              <Package className="w-6 h-6" />
            </div>
            <span className={stats?.lowStock > 0 ? 'badge badge-danger' : 'badge badge-success'}>
              {stats?.lowStock > 0 ? <AlertTriangle className="w-3 h-3 mr-1" /> : null}
              {stats?.lowStock || 0} items
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{stats?.lowStock || 0}</p>
            <p className="text-sm text-gray-500">Low Stock Alerts</p>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Sales Overview</h3>
              <p className="text-sm text-gray-500">Last 7 days performance</p>
            </div>
            <button
              onClick={() => setCurrentPage('reports')}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              View Details <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-72">
            <Line data={salesChartData} options={salesChartOptions} />
          </div>
        </motion.div>

        {/* Profit Distribution */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Profit Breakdown</h3>
              <p className="text-sm text-gray-500">This month</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72 flex items-center justify-center">
            <Doughnut data={profitChartData} options={profitChartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <motion.div variants={itemVariants} className="lg:col-span-2 card">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Recent Sales</h3>
              <p className="text-sm text-gray-500">Latest transactions</p>
            </div>
            <button
              onClick={() => setCurrentPage('sales')}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {stats?.recentSales?.map((sale) => (
              <div key={sale.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-semibold">
                    {sale.reference.slice(-3)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sale.reference}</p>
                    <p className="text-sm text-gray-500">{sale.user_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(sale.grand_total)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(sale.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div variants={itemVariants} className="card">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Top Products</h3>
              <p className="text-sm text-gray-500">Best sellers this week</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {stats?.topProducts?.map((product, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-amber-100 text-amber-600' :
                  index === 1 ? 'bg-gray-200 text-gray-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{product.product_name}</p>
                  <p className="text-sm text-gray-500">{product.total_qty} sold</p>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(product.total_sales)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setCurrentPage('pos')}
          className="card p-5 hover:border-red-200 hover:shadow-lg transition-all group"
        >
          <ShoppingCart className="w-8 h-8 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-gray-900">New Sale</p>
          <p className="text-sm text-gray-500">Start billing</p>
        </button>

        <button
          onClick={() => setCurrentPage('products')}
          className="card p-5 hover:border-indigo-200 hover:shadow-lg transition-all group"
        >
          <Package className="w-8 h-8 text-indigo-500 mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-gray-900">Products</p>
          <p className="text-sm text-gray-500">Manage inventory</p>
        </button>

        <button
          onClick={() => setCurrentPage('customers')}
          className="card p-5 hover:border-emerald-200 hover:shadow-lg transition-all group"
        >
          <Users className="w-8 h-8 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-gray-900">Customers</p>
          <p className="text-sm text-gray-500">CRM & loyalty</p>
        </button>

        <button
          onClick={() => setCurrentPage('reports')}
          className="card p-5 hover:border-amber-200 hover:shadow-lg transition-all group"
        >
          <BarChart3 className="w-8 h-8 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-gray-900">Reports</p>
          <p className="text-sm text-gray-500">Analytics</p>
        </button>
      </motion.div>
    </motion.div>
  );
}

export default Dashboard;
