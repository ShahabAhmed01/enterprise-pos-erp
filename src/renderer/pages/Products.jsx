import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Edit2, Trash2, Package, Grid, List, Filter, 
  Download, Upload, MoreVertical, X, Loader2, Image, Barcode,
  AlertTriangle, Check, ChevronLeft, ChevronRight
} from 'lucide-react';

function Products({ user, showToast, setCurrentPage }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [formData, setFormData] = useState({
    name: '', sku: '', barcode: '', description: '', category_id: '',
    brand_id: '', cost_price: '', selling_price: '', tax_rate: '10',
    min_stock_level: '10', is_track_stock: true, is_sellable: true
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
  }, [page, search]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.getProducts({ page, limit: 20, search, status: 1 });
        if (result.success) {
          setProducts(result.products);
          setTotalPages(result.pages);
        }
      } else {
        setProducts([
          { id: '1', name: 'Wireless Headphones', sku: 'ELEC001', selling_price: 89.99, cost_price: 45.00, stock_quantity: 50, category_name: 'Electronics', is_active: 1 },
          { id: '2', name: 'USB-C Cable', sku: 'ELEC002', selling_price: 15.99, cost_price: 5.00, stock_quantity: 100, category_name: 'Electronics', is_active: 1 },
          { id: '3', name: 'Smart Watch Pro', sku: 'ELEC003', selling_price: 249.99, cost_price: 120.00, stock_quantity: 5, category_name: 'Electronics', is_active: 1 },
          { id: '4', name: 'Coffee Beans', sku: 'GROC001', selling_price: 18.99, cost_price: 8.00, stock_quantity: 80, category_name: 'Groceries', is_active: 1 },
          { id: '5', name: 'Running Shoes', sku: 'FASH001', selling_price: 129.99, cost_price: 65.00, stock_quantity: 30, category_name: 'Fashion', is_active: 1 },
        ]);
        setTotalPages(1);
      }
    } catch (error) {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.getCategories();
      if (result.success) setCategories(result.categories);
    } else {
      setCategories([
        { id: '1', name: 'Electronics' },
        { id: '2', name: 'Groceries' },
        { id: '3', name: 'Fashion' },
        { id: '4', name: 'Home & Garden' },
      ]);
    }
  };

  const loadBrands = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.getBrands();
      if (result.success) setBrands(result.brands);
    } else {
      setBrands([
        { id: '1', name: 'Apple' },
        { id: '2', name: 'Samsung' },
        { id: '3', name: 'Sony' },
        { id: '4', name: 'Nike' },
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (window.electronAPI) {
        const result = editingProduct
          ? await window.electronAPI.updateProduct({ id: editingProduct.id, ...formData })
          : await window.electronAPI.createProduct(formData);
        
        if (result.success) {
          showToast(editingProduct ? 'Product updated!' : 'Product created!', 'success');
          loadProducts();
          setShowModal(false);
        }
      } else {
        showToast('Product saved! (Demo)', 'success');
        setShowModal(false);
      }
    } catch (error) {
      showToast('Operation failed', 'error');
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      if (window.electronAPI) {
        await window.electronAPI.deleteProduct({ id: product.id });
      }
      showToast('Product deleted', 'success');
      loadProducts();
    } catch (error) {
      showToast('Delete failed', 'error');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      description: product.description || '',
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      cost_price: product.cost_price || '',
      selling_price: product.selling_price || '',
      tax_rate: product.tax_rate || '10',
      min_stock_level: product.min_stock_level || '10',
      is_track_stock: product.is_track_stock,
      is_sellable: product.is_sellable
    });
    setShowModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Manage your product inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="btn-outline flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={() => { setEditingProduct(null); setFormData({ name: '', sku: '', barcode: '', description: '', category_id: '', brand_id: '', cost_price: '', selling_price: '', tax_rate: '10', min_stock_level: '10', is_track_stock: true, is_sellable: true }); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="input pl-12"
          />
        </div>
        <select className="select w-48">
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select className="select w-48">
          <option value="">All Brands</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
        <div className="flex border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-red-500 text-white' : 'bg-white text-gray-500'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-red-500 text-white' : 'bg-white text-gray-500'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-5 card-hover group"
            >
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-4 flex items-center justify-center text-5xl relative">
                {product.category_name === 'Electronics' ? '📱' : product.category_name === 'Groceries' ? '🛒' : product.category_name === 'Fashion' ? '👕' : '📦'}
                {product.stock_quantity <= product.min_stock_level && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.sku} • {product.category_name}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-red-600">${product.selling_price?.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Cost: ${product.cost_price?.toFixed(2)}</p>
                  </div>
                  <div className={`text-sm font-medium ${product.stock_quantity > 10 ? 'text-emerald-500' : product.stock_quantity > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                    {product.stock_quantity} in stock
                  </div>
                </div>
                <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(product)} className="flex-1 btn-outline btn-sm flex items-center justify-center gap-1">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleDelete(product)} className="btn-outline btn-sm text-red-500 hover:bg-red-50">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                      {product.category_name === 'Electronics' ? '📱' : '📦'}
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </td>
                  <td>{product.sku}</td>
                  <td>{product.category_name}</td>
                  <td>${product.cost_price?.toFixed(2)}</td>
                  <td className="font-semibold text-red-600">${product.selling_price?.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${product.stock_quantity > 10 ? 'badge-success' : product.stock_quantity > 0 ? 'badge-warning' : 'badge-danger'}`}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(product)} className="btn-ghost p-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product)} className="btn-ghost p-2 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-outline btn-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn-outline btn-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-backdrop"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal w-[700px] max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="label">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">SKU *</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="input"
                      placeholder="Product SKU"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Barcode</label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="input"
                      placeholder="Barcode number"
                    />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="select"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Brand</label>
                    <select
                      value={formData.brand_id}
                      onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                      className="select"
                    >
                      <option value="">Select brand</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Cost Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="label">Selling Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      className="input"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                      className="input"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="label">Min Stock Level</label>
                    <input
                      type="number"
                      value={formData.min_stock_level}
                      onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                      className="input"
                      placeholder="10"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input min-h-[100px]"
                      placeholder="Product description"
                    />
                  </div>
                  <div className="col-span-2 flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_track_stock}
                        onChange={(e) => setFormData({ ...formData, is_track_stock: e.target.checked })}
                        className="checkbox"
                      />
                      <span>Track Stock</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_sellable}
                        onChange={(e) => setFormData({ ...formData, is_sellable: e.target.checked })}
                        className="checkbox"
                      />
                      <span>Can be Sold</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Products;
