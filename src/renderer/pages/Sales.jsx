import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Download, Eye, RefreshCw, ChevronLeft, ChevronRight,
  Calendar, Filter, ArrowUpRight, ArrowDownRight, Loader2, X,
  Receipt, DollarSign, CreditCard, User
} from 'lucide-react';
import { format } from 'date-fns';

function Sales({ user, showToast, setCurrentPage }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadSales();
  }, [page, dateFrom, dateTo]);

  const loadSales = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.getSales({
          page, limit: 15, dateFrom, dateTo, status: 'completed'
        });
        if (result.success) {
          setSales(result.sales);
          setTotalPages(Math.ceil(result.total / 15));
        }
      } else {
        setSales([
          { id: '1', reference: 'INV001', grand_total: 245.99, paid_amount: 250, status: 'completed', payment_method: 'cash', user_name: 'Sarah Johnson', customer_name: 'John Doe', created_at: new Date().toISOString() },
          { id: '2', reference: 'INV002', grand_total: 89.50, paid_amount: 89.50, status: 'completed', payment_method: 'card', user_name: 'Mike Williams', customer_name: null, created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: '3', reference: 'INV003', grand_total: 432.00, paid_amount: 432, status: 'completed', payment_method: 'cash', user_name: 'Emily Brown', customer_name: 'Jane Smith', created_at: new Date(Date.now() - 7200000).toISOString() },
          { id: '4', reference: 'INV004', grand_total: 156.75, paid_amount: 156.75, status: 'completed', payment_method: 'mobile', user_name: 'Sarah Johnson', customer_name: null, created_at: new Date(Date.now() - 10800000).toISOString() },
          { id: '5', reference: 'INV005', grand_total: 299.00, paid_amount: 300, status: 'completed', payment_method: 'card', user_name: 'Mike Williams', customer_name: 'Bob Wilson', created_at: new Date(Date.now() - 14400000).toISOString() },
        ]);
        setTotalPages(1);
      }
    } catch (error) {
      showToast('Failed to load sales', 'error');
    } finally {
      setLoading(false);
    }
  };

  const viewSaleDetails = async (sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
    
    if (window.electronAPI) {
      const result = await window.electronAPI.getSaleById({ id: sale.id });
      if (result.success) {
        setSaleItems(result.items);
      }
    } else {
      setSaleItems([
        { id: '1', product_name: 'Wireless Headphones', quantity: 2, unit_price: 89.99, subtotal: 179.98 },
        { id: '2', product_name: 'USB-C Cable', quantity: 4, unit_price: 15.99, subtotal: 63.96 },
      ]);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const totalSales = sales.reduce((sum, s) => sum + s.grand_total, 0);
  const totalOrders = sales.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-500">View and manage all sales transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => setCurrentPage('pos')} className="btn-primary flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            New Sale
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5 flex items-center gap-4">
          <div className="stat-icon bg-emerald-100 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
            <p className="text-sm text-gray-500">Total Sales</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="stat-icon bg-indigo-100 text-indigo-600">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            <p className="text-sm text-gray-500">Total Orders</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="stat-icon bg-amber-100 text-amber-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSales / (totalOrders || 1))}</p>
            <p className="text-sm text-gray-500">Average Order</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input w-40"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input w-40"
          />
        </div>
        <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="btn-ghost btn-sm">
          Clear
        </button>
        <div className="flex-1" />
        <button onClick={loadSales} className="btn-ghost p-2">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Sales Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Cashier</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Change</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="font-medium">{sale.reference}</td>
                  <td>{format(new Date(sale.created_at), 'MMM d, yyyy HH:mm')}</td>
                  <td>
                    {sale.customer_name ? (
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {sale.customer_name}
                      </span>
                    ) : (
                      <span className="text-gray-400">Walk-in</span>
                    )}
                  </td>
                  <td>{sale.user_name}</td>
                  <td>
                    <span className={`badge ${
                      sale.payment_method === 'cash' ? 'badge-success' :
                      sale.payment_method === 'card' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {sale.payment_method}
                    </span>
                  </td>
                  <td className="font-semibold text-gray-900">{formatCurrency(sale.grand_total)}</td>
                  <td className="text-emerald-600">
                    {sale.paid_amount > sale.grand_total ? formatCurrency(sale.paid_amount - sale.grand_total) : '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => viewSaleDetails(sale)}
                      className="btn-ghost p-2"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-outline btn-sm">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-outline btn-sm">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSale && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowDetailModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">Sale Details - {selectedSale.reference}</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">{format(new Date(selectedSale.created_at), 'PPpp')}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium capitalize">{selectedSale.payment_method}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Cashier</p>
                  <p className="font-medium">{selectedSale.user_name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedSale.customer_name || 'Walk-in Customer'}</p>
                </div>
              </div>

              <h4 className="font-semibold mb-3">Items</h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Product</th>
                      <th className="text-center p-3">Qty</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-right p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleItems.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="p-3">{item.product_name}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedSale.sub_total)}</span>
                </div>
                {selectedSale.total_discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedSale.total_discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(selectedSale.total_tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-red-600">{formatCurrency(selectedSale.grand_total)}</span>
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
    </motion.div>
  );
}

export default Sales;
