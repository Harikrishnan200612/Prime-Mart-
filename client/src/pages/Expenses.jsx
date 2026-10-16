import React, { useState, useEffect } from 'react';
import { expenseService } from '../services/api';
import PageHeader from '../components/PageHeader';
import './Pages.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const categories = [
    'Stock Purchase',
    'Shop Rent',
    'Electricity',
    'Water',
    'Internet',
    'Staff Salary',
    'Transportation',
    'Maintenance',
    'Marketing',
    'Other'
  ];

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    paymentMethod: 'Cash',
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, [search, filterCategory]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await expenseService.getAll({ search, category: filterCategory });
      setExpenses(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
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
        await expenseService.update(editingId, formData);
      } else {
        await expenseService.create(formData);
      }
      setShowModal(false);
      resetForm();
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes
    });
    setEditingId(expense._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await expenseService.delete(id);
      fetchExpenses();
    } catch (err) {
      setError('Failed to delete expense');
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      amount: '',
      description: '',
      paymentMethod: 'Cash',
      notes: ''
    });
    setEditingId(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Calculate totals by category
  const categoryTotals = {};
  expenses.forEach(exp => {
    if (!categoryTotals[exp.category]) {
      categoryTotals[exp.category] = 0;
    }
    categoryTotals[exp.category] += exp.amount;
  });

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <PageHeader tone="expenses" icon="−" title="Expenses Management" subtitle="Monitor and control business spending" action={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Expense</button>} />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-group">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by description..."
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

      {/* Category Summary */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3>Expenses by Category</h3>
          </div>
          <div className="stats-row">
            {Object.entries(categoryTotals).map(([category, total]) => (
              <div key={category} className="stat-box warning">
                <div className="stat-label">{category}</div>
                <div className="stat-value">₹{total.toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="card">
          <div className="empty-state-container">
            <div className="empty-state-icon">📭</div>
            <h2>No Expenses Yet</h2>
            <p>Start by recording your business expenses</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Add First Expense
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense._id}>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td>{expense.category}</td>
                    <td>{expense.description}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>
                      -₹{expense.amount.toLocaleString('en-IN')}
                    </td>
                    <td><span className="badge badge-warning">{expense.paymentMethod}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn" onClick={() => handleEdit(expense)}>
                          ✏️
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(expense._id)}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Expense' : 'Add New Expense'}</h2>
              <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    name="category"
                    className="form-control"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Amount *</label>
                    <input
                      type="number"
                      name="amount"
                      className="form-control"
                      value={formData.amount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      name="paymentMethod"
                      className="form-control"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                    >
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Card</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    name="description"
                    className="form-control"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add description..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    name="notes"
                    className="form-control"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add any additional notes..."
                  ></textarea>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Update Expense' : 'Add Expense'}
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

export default Expenses;
