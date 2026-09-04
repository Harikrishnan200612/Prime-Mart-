import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { reportsService } from '../services/api';
import PageHeader from '../components/PageHeader';
import './Pages.css';

const Reports = () => {
  const [period, setPeriod] = useState('month');
  const [salesData, setSalesData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    fetchReportsData();
  }, [period]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [sales, expenses, profit, payment, products] = await Promise.all([
        reportsService.getSalesReport({ period }),
        reportsService.getExpensesReport({ period }),
        reportsService.getProfitReport({ period }),
        reportsService.getPaymentMethodsReport({ period }),
        reportsService.getTopProducts({ period, limit: 10 })
      ]);

      setSalesData(sales.data);
      setExpenseData(expenses.data);
      setProfitData(profit.data);
      setPaymentData(payment.data);
      setTopProducts(products.data);
      setError('');
    } catch (err) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <PageHeader tone="reports" icon="⌁" title="Reports & Analytics" subtitle="Understand your business performance" action={
        <div className="page-actions">
          <select
            className="form-control"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ maxWidth: '200px' }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      } />

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Sales Chart */}
      {salesData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>📊 Sales Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#2563eb" name="Daily Sales" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Expenses by Category Chart */}
      {expenseData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>💸 Expenses by Category</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Bar dataKey="total" fill="#f59e0b" name="Amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Profit Chart */}
      {profitData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>📈 Profit Analysis</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#10b981" name="Sales" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" stroke="#2563eb" name="Profit" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Payment Methods Pie Chart */}
      {paymentData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>💳 Payment Methods Distribution</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData}
                  dataKey="total"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ method, percentage }) => `${method}: ${percentage}%`}
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>🏆 Top Selling Products</h3>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product Name</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                  <th>Avg per Unit</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={index}>
                    <td>
                      <strong>
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </strong>
                    </td>
                    <td>{product._id}</td>
                    <td>{product.totalQuantity} units</td>
                    <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                      ₹{product.totalRevenue.toLocaleString('en-IN')}
                    </td>
                    <td>₹{(product.totalRevenue / product.totalQuantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Methods Summary Table */}
      {paymentData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>📊 Payment Methods Summary</h3>
          </div>
          <div className="stats-row">
            {paymentData.map(method => (
              <div key={method.method} className="stat-box">
                <div className="stat-label">{method.method}</div>
                <div className="stat-value">₹{method.total.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {method.percentage}% • {method.count} transactions
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
