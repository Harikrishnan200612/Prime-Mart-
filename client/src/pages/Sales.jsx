import React, { useEffect, useMemo, useState } from 'react';
import { productService, saleService } from '../services/api';
import PageHeader from '../components/PageHeader';
import './Pages.css';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const initialForm = {
  productId: '', quantity: '', sellingPrice: '', paymentMethod: 'Cash',
  customerName: '', notes: '', date: new Date().toISOString().slice(0, 10)
};

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formData, setFormData] = useState(initialForm);

  const fetchSalesAndProducts = async () => {
    try {
      setLoading(true);
      const [salesRes, productsRes] = await Promise.all([
        saleService.getAll({ search, paymentMethod: filterMethod, startDate, endDate }),
        productService.getAll({})
      ]);
      setSales(salesRes.data);
      setProducts(productsRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load sales data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSalesAndProducts(); }, [search, filterMethod, startDate, endDate]);

  const summary = useMemo(() => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const total = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
    const todaySales = sales.filter((sale) => new Date(sale.date).toISOString().slice(0, 10) === todayKey);
    const todayTotal = todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
    const methods = sales.reduce((counts, sale) => ({ ...counts, [sale.paymentMethod]: (counts[sale.paymentMethod] || 0) + 1 }), {});
    const top = Object.entries(methods).sort((a, b) => b[1] - a[1])[0];
    return {
      total, count: sales.length, todayTotal, todayCount: todaySales.length,
      average: sales.length ? total / sales.length : 0,
      topMethod: top?.[0] || '—', topPercent: top ? Math.round((top[1] / sales.length) * 100) : 0
    };
  }, [sales]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (name === 'productId') {
      const product = products.find((item) => item._id === value);
      if (product) setFormData((previous) => ({ ...previous, productId: value, sellingPrice: product.sellingPrice }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...formData, quantity: Number(formData.quantity), sellingPrice: Number(formData.sellingPrice) };
      if (editingId) await saleService.update(editingId, payload);
      else await saleService.create(payload);
      setNotice(editingId ? 'Sale updated successfully.' : 'Sale added successfully.');
      setShowModal(false);
      setFormData(initialForm);
      setEditingId(null);
      await fetchSalesAndProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save this sale.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (sale) => {
    setFormData({
      productId: sale.productId?._id || sale.productId, quantity: sale.quantity,
      sellingPrice: sale.sellingPrice, paymentMethod: sale.paymentMethod,
      customerName: sale.customerName || '', notes: sale.notes || '',
      date: new Date(sale.date).toISOString().slice(0, 10)
    });
    setEditingId(sale._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale? Inventory will be restored.')) return;
    try {
      await saleService.delete(id);
      setNotice('Sale deleted successfully.');
      await fetchSalesAndProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete this sale.');
    }
  };

  const clearFilters = () => { setSearch(''); setFilterMethod(''); setStartDate(''); setEndDate(''); };
  const closeModal = () => { setShowModal(false); setEditingId(null); setFormData(initialForm); };

  if (loading && !sales.length) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page sales-page">
      <PageHeader tone="sales" icon="↗" title="Sales Management" subtitle="Track transactions, revenue and payment performance" action={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Sale</button>} />

      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}<button className="alert-close" onClick={() => setNotice('')}>×</button></div>}

      <section className="sales-stats">
        {[
          ['Total sales', money(summary.total), `${summary.count} transactions`, 'blue'],
          ["Today's sales", money(summary.todayTotal), `${summary.todayCount} transactions today`, 'green'],
          ['Average sale', money(summary.average), 'Across all transactions', 'purple'],
          ['Top payment method', summary.topMethod, `${summary.topPercent}% of transactions`, 'orange']
        ].map(([label, value, caption, tone]) => (
          <div className="sales-stat-card" key={label}>
            <div className={`stat-accent ${tone}`} />
            <span className="sales-stat-label">{label}</span>
            <strong>{value}</strong>
            <small>{caption}</small>
          </div>
        ))}
      </section>

      <section className="card sales-toolbar">
        <div className="sales-search">
          <span>⌕</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by product or customer" />
        </div>
        <select className="form-control" value={filterMethod} onChange={(event) => setFilterMethod(event.target.value)}>
          <option value="">All payment methods</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option>
        </select>
        <input className="form-control date-control" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} aria-label="Start date" />
        <input className="form-control date-control" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} aria-label="End date" />
        <button className="clear-filter" onClick={clearFilters}>Clear</button>
      </section>

      <section className="card sales-table-card">
        <div className="table-heading"><div><h2>Recent sales</h2><p>{sales.length} transaction{sales.length === 1 ? '' : 's'} found</p></div></div>
        {sales.length === 0 ? (
          <div className="empty-state-container"><div className="empty-state-icon">＋</div><h2>No sales found</h2><p>Try changing your filters or add your first transaction.</p><button className="btn btn-primary" onClick={() => setShowModal(true)}>Add sale</button></div>
        ) : (
          <div className="table-wrapper"><table className="table sales-table"><thead><tr>
            <th>Date</th><th>Product</th><th>Customer</th><th>Quantity</th><th>Unit price</th><th>Total</th><th>Payment method</th><th>Actions</th>
          </tr></thead><tbody>{sales.map((sale) => (
            <tr key={sale._id}>
              <td>{new Date(sale.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
              <td className="product-cell"><strong>{sale.productName}</strong></td>
              <td>{sale.customerName || 'Walk-in Customer'}</td><td>{sale.quantity}</td><td>{money(sale.sellingPrice)}</td>
              <td className="total-cell">+{money(sale.totalAmount)}</td>
              <td><span className={`payment-badge ${String(sale.paymentMethod).toLowerCase()}`}>{sale.paymentMethod}</span></td>
              <td><div className="action-buttons"><button className="action-btn" onClick={() => handleEdit(sale)}>Edit</button><button className="action-btn delete" onClick={() => handleDelete(sale._id)}>Delete</button></div></td>
            </tr>
          ))}</tbody></table></div>
        )}
      </section>

      {showModal && <div className="modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
        <div className="modal sales-modal" role="dialog" aria-modal="true">
          <div className="modal-header"><div><span className="eyebrow">TRANSACTION</span><h2>{editingId ? 'Edit sale' : 'Add new sale'}</h2></div><button className="modal-close" onClick={closeModal}>×</button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-group"><label className="form-label">Product *</label><select name="productId" className="form-control" value={formData.productId} onChange={handleChange} required><option value="">Select a product</option>{products.map((product) => <option key={product._id} value={product._id}>{product.name} · {product.stock} in stock</option>)}</select></div>
            <div className="form-grid"><div className="form-group"><label className="form-label">Quantity *</label><input type="number" name="quantity" className="form-control" value={formData.quantity} onChange={handleChange} min="1" required /></div><div className="form-group"><label className="form-label">Price *</label><input type="number" name="sellingPrice" className="form-control" value={formData.sellingPrice} onChange={handleChange} min="0" step="0.01" required /></div></div>
            <div className="form-grid"><div className="form-group"><label className="form-label">Payment method *</label><select name="paymentMethod" className="form-control" value={formData.paymentMethod} onChange={handleChange}><option>Cash</option><option>UPI</option><option>Card</option></select></div><div className="form-group"><label className="form-label">Date</label><input type="date" name="date" className="form-control" value={formData.date} onChange={handleChange} /></div></div>
            <div className="form-group"><label className="form-label">Customer</label><input type="text" name="customerName" className="form-control" value={formData.customerName} onChange={handleChange} placeholder="Walk-in Customer" /></div>
            <div className="form-group"><label className="form-label">Notes</label><textarea name="notes" className="form-control" value={formData.notes} onChange={handleChange} placeholder="Optional notes" /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update sale' : 'Add sale'}</button></div></form>
        </div>
      </div>}
    </div>
  );
};

export default Sales;
