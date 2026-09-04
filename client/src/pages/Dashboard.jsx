import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import PageHeader from '../components/PageHeader';
import './Pages.css';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getSummary();
      setData(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const isProfitable = data.netProfit >= 0;

  return (
    <div className="page">
      <PageHeader tone="blue" icon="▦" title="Dashboard" subtitle="Welcome back. Here's your business overview." />

      <div className="dashboard-grid">
        {/* Total Sales Card */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Total Sales</div>
              <div className="stat-card-value">₹{data.totalSales.toLocaleString('en-IN')}</div>
            </div>
            <div className="stat-card-icon">💰</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {data.transactionCount} transactions
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Total Expenses</div>
              <div className="stat-card-value">₹{data.totalExpenses.toLocaleString('en-IN')}</div>
            </div>
            <div className="stat-card-icon">💸</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Operational & overhead
          </div>
        </div>

        {/* Net Profit/Loss Card */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Net Profit/Loss</div>
              <div className={`stat-card-value ${isProfitable ? 'stat-profit' : 'stat-loss'}`}>
                {isProfitable ? '🟢' : '🔴'} ₹{Math.abs(data.netProfit).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="stat-card-icon">{isProfitable ? '📈' : '📉'}</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {isProfitable ? 'Profit' : 'Loss'}
          </div>
        </div>

        {/* Profit Margin Card */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Profit Margin</div>
              <div className="stat-card-value">{data.profitMargin}%</div>
            </div>
            <div className="stat-card-icon">📊</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Margin on sales
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h2>Today's Summary</h2>
        </div>
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-card-label">Today's Sales</div>
            <div className="stat-card-value">₹{data.todaysSales.toLocaleString('en-IN')}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Today's Expenses</div>
            <div className="stat-card-value">₹{data.todaysExpenses.toLocaleString('en-IN')}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Today's Profit/Loss</div>
            <div className={`stat-card-value ${data.todaysProfit >= 0 ? 'stat-profit' : 'stat-loss'}`}>
              {data.todaysProfit >= 0 ? '🟢' : '🔴'} ₹{Math.abs(data.todaysProfit).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Low Stock Products</div>
            <div className={`stat-card-value ${data.lowStockCount > 0 ? 'stat-warning' : 'text-success'}`}>
              {data.lowStockCount}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
