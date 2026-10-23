import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { productService } from '../services/api';
import PageHeader from '../components/PageHeader';
import './Pages.css';

// Accepts flexible column headers (case/spacing insensitive) when reading an uploaded sheet.
const normalizeRow = (row) => {
  const out = {};
  Object.keys(row).forEach((key) => {
    out[String(key).trim().toLowerCase().replace(/[\s_-]+/g, '')] = row[key];
  });
  return out;
};

const pick = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') return row[key];
  }
  return undefined;
};

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [importing, setImporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    purchasePrice: '',
    sellingPrice: '',
    stock: '',
    minimumStock: '',
    supplier: ''
  });

  // State for Purchase Stock Modal
  const [purchaseProduct, setPurchaseProduct] = useState(null);
  const [purchaseData, setPurchaseData] = useState({
    quantity: 1,
    unitCost: '',
    supplier: '',
    paymentMethod: 'Cash',
    notes: ''
  });
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [search, filterCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll({ search, category: filterCategory });
      setProducts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock, minStock) => {
    if (stock > minStock) return { status: 'In Stock', badge: 'badge-success', emoji: '🟢' };
    if (stock === 0) return { status: 'Out of Stock', badge: 'badge-danger', emoji: '🔴' };
    return { status: 'Low Stock', badge: 'badge-warning', emoji: '⚠️' };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await productService.update(editingId, formData);
      } else {
        await productService.create(formData);
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      minimumStock: product.minimumStock,
      supplier: product.supplier
    });
    setEditingId(product._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productService.delete(id);
      fetchProducts();
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  // Opens the dedicated Inventory Purchase modal
  const openPurchaseModal = (product) => {
    setPurchaseProduct(product);
    setPurchaseData({
      quantity: 1,
      unitCost: product.purchasePrice !== undefined ? product.purchasePrice : '',
      supplier: product.supplier || '',
      paymentMethod: 'Cash',
      notes: ''
    });
  };

  // Submits the inventory purchase (creates purchase transaction & auto-expense)
  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseProduct || purchasing) return;
    const qty = parseInt(purchaseData.quantity, 10);
    const unitCost = parseFloat(purchaseData.unitCost);

    if (!qty || qty <= 0) {
      setError('Quantity to purchase must be at least 1');
      return;
    }
    if (isNaN(unitCost) || unitCost < 0) {
      setError('Purchase price per unit must be 0 or more');
      return;
    }

    setPurchasing(true);
    setError('');
    try {
      const ref = `PUR-${Date.now()}-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
      await productService.increaseStock(purchaseProduct._id, {
        quantity: qty,
        unitCost,
        supplier: purchaseData.supplier,
        paymentMethod: purchaseData.paymentMethod,
        notes: purchaseData.notes,
        purchaseReference: ref
      });
      const totalAmount = qty * unitCost;
      setNotice(`Recorded purchase: ${qty} units of ${purchaseProduct.name} (Total: ₹${totalAmount.toLocaleString('en-IN')}). Added automatically to Expenses.`);
      setPurchaseProduct(null);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record inventory purchase');
    } finally {
      setPurchasing(false);
    }
  };

  // Decreases stock (manual adjustment / wastage / damage - does not record an expense)
  const handleDecreaseStock = async (productId) => {
    const quantity = prompt('Enter quantity to decrease (wastage/adjustment):', '1');
    if (!quantity || isNaN(quantity) || quantity <= 0) return;
    try {
      await productService.decreaseStock(productId, { quantity: parseInt(quantity, 10) });
      fetchProducts();
      setNotice('Stock adjusted successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleExport = () => {
    const rows = products.map((product) => ({
      Name: product.name,
      SKU: product.sku,
      Category: product.category,
      'Purchase Price': product.purchasePrice,
      'Selling Price': product.sellingPrice,
      Stock: product.stock,
      'Minimum Stock': product.minimumStock,
      Supplier: product.supplier || '',
      'Stock Value': Number(product.stock || 0) * Number(product.purchasePrice || 0)
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Inventory');
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `prime-mart-inventory-${stamp}.xlsx`);
    setNotice(`Exported ${rows.length} product${rows.length === 1 ? '' : 's'} to Excel.`);
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError('');
    setNotice('');
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

      let success = 0;
      let failed = 0;
      for (const raw of rawRows) {
        const row = normalizeRow(raw);
        const name = pick(row, ['name', 'productname']);
        const sku = pick(row, ['sku', 'skucode', 'code']);
        const category = pick(row, ['category']);
        const purchasePrice = pick(row, ['purchaseprice', 'costprice', 'cost']);
        const sellingPrice = pick(row, ['sellingprice', 'price', 'saleprice', 'mrp']);
        const stock = pick(row, ['stock', 'quantity', 'qty']);
        const minimumStock = pick(row, ['minimumstock', 'minstock', 'minimum']);
        const supplier = pick(row, ['supplier', 'vendor']);

        if (!name || !sku || !category || purchasePrice === undefined || sellingPrice === undefined) {
          failed += 1;
          continue;
        }

        try {
          await productService.create({
            name: String(name),
            sku: String(sku),
            category: String(category),
            purchasePrice: Number(purchasePrice) || 0,
            sellingPrice: Number(sellingPrice) || 0,
            stock: stock !== undefined ? Number(stock) || 0 : 0,
            minimumStock: minimumStock !== undefined ? Number(minimumStock) || 0 : 5,
            supplier: supplier ? String(supplier) : ''
          });
          success += 1;
        } catch (err) {
          failed += 1;
        }
      }

      await fetchProducts();
      if (success && !failed) setNotice(`Imported ${success} product${success === 1 ? '' : 's'} successfully.`);
      else if (success && failed) setNotice(`Imported ${success} product${success === 1 ? '' : 's'}. ${failed} row(s) were skipped — check required columns.`);
      else setError('No products were imported. Check that your sheet has Name, SKU, Category, Purchase Price and Selling Price columns.');
    } catch (err) {
      setError('Could not read that file. Please upload a valid .xlsx, .xls or .csv file.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      purchasePrice: '',
      sellingPrice: '',
      stock: '',
      minimumStock: '',
      supplier: ''
    });
    setEditingId(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Calculate inventory value
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
  const categories = [...new Set(products.map(p => p.category))];

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <PageHeader
        tone="inventory"
        icon="□"
        title="Inventory Management"
        subtitle="Track products and stock levels"
        action={
          <div className="page-actions data-io-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
            <button className="btn btn-io" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? 'Importing…' : '⇪ Import Excel'}
            </button>
            <button className="btn btn-io" onClick={handleExport} disabled={!products.length}>⇩ Export Excel</button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Add Product
            </button>
          </div>
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}<button className="alert-close" onClick={() => setNotice('')}>×</button></div>}

      <div className="filter-group">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Inventory Stats */}
      {products.length > 0 && (
        <div className="stats-row">
          <div className="stat-box success">
            <div className="stat-label">Total Products</div>
            <div className="stat-value">{products.length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Inventory Value</div>
            <div className="stat-value">₹{totalInventoryValue.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-box danger">
            <div className="stat-label">Low/Out of Stock</div>
            <div className="stat-value">
              {products.filter(p => p.stock <= p.minimumStock).length}
            </div>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="card">
          <div className="empty-state-container">
            <div className="empty-state-icon">📭</div>
            <h2>No Products Yet</h2>
            <p>Start by adding products to your inventory</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Add First Product
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const stockStatus = getStockStatus(product.stock, product.minimumStock);
                  return (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td><code>{product.sku}</code></td>
                      <td>{product.category}</td>
                      <td>₹{product.purchasePrice}</td>
                      <td>₹{product.sellingPrice}</td>
                      <td>
                        <strong>{product.stock}</strong>
                        <br/>
                        <small style={{ color: 'var(--text-secondary)' }}>Min: {product.minimumStock}</small>
                      </td>
                      <td>
                        <span className={`badge ${stockStatus.badge}`}>
                          {stockStatus.emoji} {stockStatus.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn" 
                            onClick={() => openPurchaseModal(product)}
                            title="Purchase Stock (Records Expense)"
                          >
                            ➕
                          </button>
                          <button 
                            className="action-btn" 
                            onClick={() => handleDecreaseStock(product._id)}
                            title="Decrease Stock"
                            disabled={product.stock === 0}
                          >
                            ➖
                          </button>
                          <button className="action-btn" onClick={() => handleEdit(product)} title="Edit Product">
                            ✏️
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(product._id)} title="Delete Product">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">SKU *</label>
                    <input
                      type="text"
                      name="sku"
                      className="form-control"
                      value={formData.sku}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <input
                      type="text"
                      name="category"
                      className="form-control"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="e.g., Groceries"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Supplier</label>
                    <input
                      type="text"
                      name="supplier"
                      className="form-control"
                      value={formData.supplier}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Purchase Price *</label>
                    <input
                      type="number"
                      name="purchasePrice"
                      className="form-control"
                      value={formData.purchasePrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Selling Price *</label>
                    <input
                      type="number"
                      name="sellingPrice"
                      className="form-control"
                      value={formData.sellingPrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Current Stock *</label>
                    <input
                      type="number"
                      name="stock"
                      className="form-control"
                      value={formData.stock}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Minimum Stock Level *</label>
                    <input
                      type="number"
                      name="minimumStock"
                      className="form-control"
                      value={formData.minimumStock}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Record Stock Purchase Modal */}
      {purchaseProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Purchase Stock — {purchaseProduct.name}</h2>
              <button
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                onClick={() => setPurchaseProduct(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '13px' }}>
                Purchasing stock increases inventory and automatically records a corresponding business expense.
              </p>
              <form onSubmit={handlePurchaseSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Quantity to Purchase *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={purchaseData.quantity}
                      onChange={(e) => setPurchaseData(prev => ({ ...prev, quantity: e.target.value }))}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Price Per Unit (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={purchaseData.unitCost}
                      onChange={(e) => setPurchaseData(prev => ({ ...prev, unitCost: e.target.value }))}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Supplier / Vendor</label>
                    <input
                      type="text"
                      className="form-control"
                      value={purchaseData.supplier}
                      onChange={(e) => setPurchaseData(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="e.g., Wholesale Distributor"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-control"
                      value={purchaseData.paymentMethod}
                      onChange={(e) => setPurchaseData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    >
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Card</option>
                    </select>
                  </div>
                </div>

                {/* Total Cost Preview */}
                <div style={{
                  background: 'var(--bg-secondary, #f8fafc)',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--border-color, #e2e8f0)'
                }}>
                  <div>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Purchase Expense:</span>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--danger, #ef4444)' }}>
                      ₹{((parseInt(purchaseData.quantity, 10) || 0) * (parseFloat(purchaseData.unitCost) || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                    <div>Current Stock: <strong>{purchaseProduct.stock}</strong></div>
                    <div>After Purchase: <strong>{Number(purchaseProduct.stock) + (parseInt(purchaseData.quantity, 10) || 0)}</strong></div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setPurchaseProduct(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={purchasing}>
                    {purchasing ? 'Recording Purchase…' : 'Confirm Purchase & Add Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
