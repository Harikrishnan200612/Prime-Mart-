import React, { useState, useEffect } from 'react';
import { staffService } from '../services/api';
import PageHeader from '../components/PageHeader';
import './Pages.css';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const roles = ['Manager', 'Cashier', 'Sales Staff', 'Delivery Staff', 'Other'];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    salary: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchStaff();
  }, [search, filterRole, filterStatus]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffService.getAll({ search, role: filterRole, status: filterStatus });
      setStaff(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load staff');
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
        await staffService.update(editingId, formData);
      } else {
        await staffService.create(formData);
      }
      setShowModal(false);
      resetForm();
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save staff');
    }
  };

  const handleEdit = (employee) => {
    setFormData({
      name: employee.name,
      phone: employee.phone,
      email: employee.email,
      role: employee.role,
      salary: employee.salary,
      status: employee.status
    });
    setEditingId(employee._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await staffService.delete(id);
      fetchStaff();
    } catch (err) {
      setError('Failed to delete staff');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await staffService.update(id, { status: newStatus });
      fetchStaff();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      role: '',
      salary: '',
      status: 'Active'
    });
    setEditingId(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Calculate salary totals
  const activeSalaryTotal = staff
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => sum + s.salary, 0);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <PageHeader tone="staff" icon="♙" title="Staff Management" subtitle="Manage your business team" action={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Employee</button>} />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-group">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control filter-select"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">All Roles</option>
          {roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select
          className="form-control filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Staff Stats */}
      {staff.length > 0 && (
        <div className="stats-row">
          <div className="stat-box success">
            <div className="stat-label">Total Staff</div>
            <div className="stat-value">{staff.length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Active Employees</div>
            <div className="stat-value">{staff.filter(s => s.status === 'Active').length}</div>
          </div>
          <div className="stat-box danger">
            <div className="stat-label">Monthly Salary</div>
            <div className="stat-value">₹{activeSalaryTotal.toLocaleString('en-IN')}</div>
          </div>
        </div>
      )}

      {staff.length === 0 ? (
        <div className="card">
          <div className="empty-state-container">
            <div className="empty-state-icon">👥</div>
            <h2>No Staff Members Yet</h2>
            <p>Start by adding your team members</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Add First Employee
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Joining Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(employee => (
                  <tr key={employee._id}>
                    <td><strong>{employee.name}</strong></td>
                    <td>{employee.email}</td>
                    <td>{employee.phone}</td>
                    <td><span className="badge badge-primary">{employee.role}</span></td>
                    <td>₹{employee.salary.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${employee.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td>{new Date(employee.joiningDate).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn"
                          onClick={() => toggleStatus(employee._id, employee.status)}
                          title={employee.status === 'Active' ? 'Deactivate' : 'Activate'}
                        >
                          {employee.status === 'Active' ? '✓' : '◯'}
                        </button>
                        <button className="action-btn" onClick={() => handleEdit(employee)}>
                          ✏️
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(employee._id)}>
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
              <h2>{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Employee Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select
                      name="role"
                      className="form-control"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Monthly Salary *</label>
                    <input
                      type="number"
                      name="salary"
                      className="form-control"
                      value={formData.salary}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Update Employee' : 'Add Employee'}
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

export default Staff;
