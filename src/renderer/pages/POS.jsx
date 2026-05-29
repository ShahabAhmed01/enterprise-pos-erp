import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, User, CreditCard, Banknote,
  QrCode, Percent, Gift, Clock, X, Printer, Loader2, Check, AlertCircle,
  RefreshCw, History, Pause, ArrowLeft, ArrowRight, Trash, Edit2
} from 'lucide-react';
import { format } from 'date-fns';

function POS({ user, showToast, setCurrentPage }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadHeldOrders();
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F1') {
        e.preventDefault();
        handleQuickSale();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  const loadCategories = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.getCategories();
      if (result.success) setCategories(result.categories);
    }
    setCategories([
      { id: 1, name: 'All Products', icon: '🛍️' },
      { id: 2, name: 'Electronics', icon: '📱' },
      { id: 3, name: 'Groceries', icon: '🛒' },
      { id: 4, name: 'Fashion', icon: '👕' },
      { id: 5, name: 'Home & Garden', icon: '🏠' },
      { id: 6, name: 'Health & Beauty', icon: '💊' },
      { id: 7, name: 'Sports', icon: '⚽' },
      { id: 8, name: 'Books', icon: '📚' },
    ]);
  };

  const loadProducts = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.getProducts({ page: 1, limit: 100, status: 1 });
      if (result.success) setProducts(result.products);
    } else {
      setProducts([
        { id: '1', name: 'Wireless Headphones', sku: 'ELEC001', selling_price: 89.99, stock_quantity: 50, image: null, category_name: 'Electronics' },
        { id: '2', name: 'USB-C Cable 2m', sku: 'ELEC002', selling_price: 15.99, stock_quantity: 100, image: null, category_name: 'Electronics' },
        { id: '3', name: 'Smart Watch Pro', sku: 'ELEC003', selling_price: 249.99, stock_quantity: 25, image: null, category_name: 'Electronics' },
        { id: '4', name: 'Coffee Beans 500g', sku: 'GROC001', selling_price: 18.99, stock_quantity: 80, image: null, category_name: 'Groceries' },
        { id: '5', name: 'Olive Oil 1L', sku: 'GROC002', selling_price: 24.99, stock_quantity: 40, image: null, category_name: 'Groceries' },
        { id: '6', name: 'Running Shoes', sku: 'FASH001', selling_price: 129.99, stock_quantity: 30, image: null, category_name: 'Fashion' },
        { id: '7', name: 'LED Desk Lamp', sku: 'HOME001', selling_price: 45.99, stock_quantity: 45, image: null, category_name: 'Home & Garden' },
        { id: '8', name: 'Yoga Mat', sku: 'SPRT001', selling_price: 49.99, stock_quantity: 60, image: null, category_name: 'Sports' },
      ]);
    }
  };

  const searchProducts = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) return;
    
    if (window.electronAPI) {
      const result = await window.electronAPI.searchProducts({ query, limit: 20 });
      if (result.success) setProducts(result.products);
    }
  };

  const loadHeldOrders = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.getHeldOrders({ userId: user?.id });
      if (result.success) setHeldOrders(result.orders || []);
    }
  };

  const [heldOrders, setHeldOrders] = useState([]);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
            : item
        ));
      } else {
        showToast('Not enough stock', 'warning');
      }
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        unit_price: product.selling_price,
        quantity: 1,
        subtotal: product.selling_price,
        stock_quantity: product.stock_quantity,
        tax_rate: 10,
        tax_amount: product.selling_price * 0.1,
        discount_amount: 0
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.stock_quantity) {
          showToast('Not enough stock', 'warning');
          return item;
        }
        return {
          ...item,
          quantity: newQty,
          subtotal: newQty * item.unit_price,
          tax_amount: newQty * item.unit_price * (item.tax_rate / 100)
        };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Clear all items from cart?')) {
      setCart([]);
      setSelectedCustomer(null);
      setOrderNotes('');
      setDiscountPercent(0);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const totalTax = cart.reduce((sum, item) => sum + (item.subtotal * item.tax_rate / 100), 0);
  const grandTotal = subtotal - discountAmount + totalTax;

  const handleQuickSale = async () => {
    if (cart.length === 0) {
      showToast('Add items to cart first', 'warning');
      return;
    }
    setPaymentMethod('cash');
    setPaidAmount(grandTotal.toFixed(2));
    setShowPaymentModal(true);
  };

  const handleCompleteSale = async () => {
    setIsProcessing(true);
    
    try {
      const saleData = {
        customer_id: selectedCustomer?.id,
        user_id: user?.id,
        items: cart.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          subtotal: item.subtotal
        })),
        sub_total: subtotal,
        total_discount: discountAmount,
        total_tax: totalTax,
        grand_total: grandTotal,
        paid_amount: parseFloat(paidAmount) || grandTotal,
        due_amount: grandTotal - (parseFloat(paidAmount) || grandTotal),
        payment_method: paymentMethod,
        notes: orderNotes,
        sale_date: new Date().toISOString(),
        loyalty_points_earned: Math.floor(grandTotal),
        payments: [{
          method: paymentMethod,
          amount: parseFloat(paidAmount) || grandTotal
        }]
      };

      if (window.electronAPI) {
        const result = await window.electronAPI.createSale(saleData);
        if (result.success) {
          showToast(`Sale completed! Reference: ${result.reference}`, 'success');
          printReceipt(result.saleId);
        } else {
          showToast(result.message || 'Sale failed', 'error');
        }
      } else {
        showToast('Sale completed! (Demo mode)', 'success');
        setTimeout(() => printReceipt(), 500);
      }

      setCart([]);
      setSelectedCustomer(null);
      setOrderNotes('');
      setDiscountPercent(0);
      setShowPaymentModal(false);
      loadProducts();
    } catch (error) {
      showToast('Sale processing failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = (saleId) => {
    const printContent = `
      <div style="font-family: monospace; width: 80mm; padding: 10px;">
        <h2 style="text-align: center; margin: 0;">🏪 Enterprise POS</h2>
        <p style="text-align: center; margin: 5px 0;">123 Business Street</p>
        <hr style="border: 1px dashed #000; margin: 10px 0;">
        <p><strong>Date:</strong> ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
        <p><strong>Ref:</strong> ${saleId ? saleId.slice(0, 8) : 'DEMO'}</p>
        ${selectedCustomer ? `<p><strong>Customer:</strong> ${selectedCustomer.first_name} ${selectedCustomer.last_name}</p>` : ''}
        <hr style="border: 1px dashed #000; margin: 10px 0;">
        ${cart.map(item => `
          <div style="display: flex; justify-content: space-between;">
            <span>${item.product_name} x${item.quantity}</span>
            <span>$${item.subtotal.toFixed(2)}</span>
          </div>
        `).join('')}
        <hr style="border: 1px dashed #000; margin: 10px 0;">
        <div style="display: flex; justify-content: space-between;">
          <span>Subtotal:</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        ${discountPercent > 0 ? `
          <div style="display: flex; justify-content: space-between;">
            <span>Discount (${discountPercent}%):</span>
            <span>-$${discountAmount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between;">
          <span>Tax:</span>
          <span>$${totalTax.toFixed(2)}</span>
        </div>
        <hr style="border: 1px dashed #000; margin: 10px 0;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2em;">
          <span>TOTAL:</span>
          <span>$${grandTotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Paid:</span>
          <span>$${(parseFloat(paidAmount) || grandTotal).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Change:</span>
          <span>$${Math.max(0, (parseFloat(paidAmount) || grandTotal) - grandTotal).toFixed(2)}</span>
        </div>
        <hr style="border: 1px dashed #000; margin: 10px 0;">
        <p style="text-align: center;">Thank you for your business!</p>
        <p style="text-align: center;">Please come again</p>
      </div>
    `;

    const printWindow = window.open('', '', 'width=300,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const holdOrder = async () => {
    if (cart.length === 0) {
      showToast('Add items to cart first', 'warning');
      return;
    }

    if (window.electronAPI) {
      const result = await window.electronAPI.holdOrder({
        user_id: user?.id,
        items: cart.length,
        grand_total: grandTotal,
        cart_data: cart
      });
      if (result.success) {
        showToast(`Order held! Ref: ${result.reference}`, 'success');
        setCart([]);
        loadHeldOrders();
      }
    } else {
      showToast('Order held! (Demo mode)', 'success');
      setCart([]);
    }
  };

  const recallOrder = async (order) => {
    try {
      const orderData = order.order_data?.cart_data || JSON.parse(order.order_data)?.cart_data;
      if (orderData) {
        setCart(orderData);
        showToast('Order recalled!', 'success');
      }
    } catch (e) {
      showToast('Failed to recall order', 'error');
    }
  };

  const applyDiscount = () => {
    const percent = prompt('Enter discount percentage (0-100):');
    if (percent && !isNaN(percent)) {
      setDiscountPercent(Math.min(100, Math.max(0, parseFloat(percent))));
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6">
      {/* Left Panel - Product Search & Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setCurrentPage('dashboard')} className="btn-ghost p-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">Point of Sale</h2>
            <div className="flex-1" />
            <button
              onClick={() => setShowHeldOrders(true)}
              className="btn-outline btn-sm flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Held Orders ({heldOrders.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => searchProducts(e.target.value)}
              placeholder="Search products by name, SKU, or barcode... (Ctrl+K)"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === 1 ? null : cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  (cat.id === 1 && !selectedCategory) || selectedCategory === cat.id
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {products.map((product) => (
                <motion.button
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => addToCart(product)}
                  className="card p-4 text-left hover:border-red-200 hover:shadow-lg hover:-translate-y-1 transition-all group"
                >
                  <div className="w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-3 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                    {product.category_name === 'Electronics' ? '📱' :
                     product.category_name === 'Groceries' ? '🛒' :
                     product.category_name === 'Fashion' ? '👕' :
                     product.category_name === 'Home & Garden' ? '🏠' : '📦'}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-600">${product.selling_price?.toFixed(2)}</span>
                    <span className={`text-xs ${product.stock_quantity > 10 ? 'text-emerald-500' : product.stock_quantity > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                      {product.stock_quantity} in stock
                    </span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-[450px] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Customer & Actions */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCustomerModal(true)}
              className="flex-1 btn-outline btn-sm flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              {selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 'Select Customer'}
            </button>
            <button onClick={holdOrder} className="btn-ghost p-2" title="Pause Order">
              <Pause className="w-5 h-5" />
            </button>
            <button onClick={clearCart} className="btn-ghost p-2 text-red-500" title="Clear Cart">
              <Trash className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
              <p>Cart is empty</p>
              <p className="text-sm">Add products to start billing</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cart.map((item) => (
                <div key={item.product_id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{item.product_name}</h4>
                    <p className="text-sm text-gray-500">${item.unit_price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-20 text-right">
                    <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                    {item.discount_amount > 0 && (
                      <p className="text-xs text-emerald-500">-${item.discount_amount.toFixed(2)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal ({cart.length} items)</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          
          {discountPercent > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Discount ({discountPercent}%)</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax</span>
            <span className="font-medium">${totalTax.toFixed(2)}</span>
          </div>

          <button onClick={applyDiscount} className="w-full btn-outline btn-sm flex items-center justify-center gap-2">
            <Percent className="w-4 h-4" />
            Apply Discount
          </button>

          <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
            <span>Total</span>
            <span className="text-red-600">${grandTotal.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={holdOrder}
              disabled={cart.length === 0}
              className="btn-warning"
            >
              <Pause className="w-5 h-5" />
              Pause
            </button>
            <button
              onClick={handleQuickSale}
              disabled={cart.length === 0}
              className="btn-primary"
            >
              <CreditCard className="w-5 h-5" />
              Pay Now
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-backdrop"
              onClick={() => !isProcessing && setShowPaymentModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal w-[500px]"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Payment</h3>
                  <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Total Display */}
                <div className="text-center py-6 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl text-white mb-6">
                  <p className="text-sm opacity-80">Amount to Pay</p>
                  <p className="text-4xl font-bold">${grandTotal.toFixed(2)}</p>
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'mobile', label: 'Mobile', icon: QrCode },
                    { id: 'split', label: 'Split', icon: Percent },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === method.id
                          ? 'border-red-500 bg-red-50 text-red-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <method.icon className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>

                {/* Cash Payment */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Amount Paid</label>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="input input-lg text-right text-2xl"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex gap-2">
                      {[10, 20, 50, 100, 500].map((val) => (
                        <button
                          key={val}
                          onClick={() => setPaidAmount(grandTotal <= val ? val : grandTotal.toFixed(2))}
                          className="flex-1 btn-outline py-3"
                        >
                          ${val}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-lg font-semibold p-4 bg-gray-50 rounded-xl">
                      <span>Change Due:</span>
                      <span className="text-emerald-600">
                        ${Math.max(0, (parseFloat(paidAmount) || 0) - grandTotal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Complete Button */}
                <button
                  onClick={handleCompleteSale}
                  disabled={isProcessing}
                  className="btn-primary w-full py-4 text-lg mt-6"
                >
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-6 h-6" />
                      Complete Sale
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Held Orders Modal */}
      <AnimatePresence>
        {showHeldOrders && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-backdrop"
              onClick={() => setShowHeldOrders(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal w-[600px]"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Held Orders</h3>
                  <button onClick={() => setShowHeldOrders(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {heldOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Pause className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No held orders</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {heldOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 border border-gray-200 rounded-xl flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{order.reference}</p>
                          <p className="text-sm text-gray-500">{order.items_count} items • ${order.grand_total?.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => { recallOrder(order); setShowHeldOrders(false); }}
                          className="btn-primary btn-sm"
                        >
                          Recall
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default POS;
