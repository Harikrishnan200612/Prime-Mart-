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
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const isProfitable = (data.netProfit ?? 0) >= 0;
  const isGrossProfitable = (data.grossProfit ?? 0) >= 0;
  const isTodaysGrossProfitable = (data.todaysGrossProfit ?? 0) >= 0;
  const isTodaysNetProfitable = (data.todaysProfit ?? 0) >= 0;

  return (
    <div className="page">
      <PageHeader
        tone="blue"
        icon="▦"
        title="Dashboard"
        subtitle="Welcome back. Here's your business overview."
      />

      {data.hasIncompleteCostData && (
        <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
          ⚠️ Notice: Some historical sales records have incomplete inventory cost snapshots. COGS for those transactions may be estimated from current catalog records.
        </div>
      )}

      {/* SECTION A: OVERALL BUSINESS SUMMARY (6 CARDS) */}
      <div className="dashboard-grid">
        {/* 1. Total Sales */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Total Sales</div>
              <div className="stat-card-value">₹{(data.totalSales || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="stat-card-icon">💰</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {data.transactionCount ?? 0} transactions
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {data.salesCount ?? 0} sales · {data.unitsSold ?? 0} units sold
          </div>
        </div>

        {/* 2. Inventory Purchase Expenses */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Inventory Purchase Expenses</div>
              <div className="stat-card-value">₹{(data.inventoryExpenses || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="stat-card-icon">📦</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Cost of inventory acquired
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Capitalized inventory stock
          </div>
        </div>

        {/* 3. Other Operating Expenses */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Other Operating Expenses</div>
              <div className="stat-card-value">₹{(data.operatingExpenses || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="stat-card-icon">🏢</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Rent, utilities, staff & overhead
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Total expenses: ₹{(data.totalExpenses || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* 4. Cost of Goods Sold */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Cost of Goods Sold</div>
              <div className="stat-card-value">₹{(data.cogs || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="stat-card-icon">🏷️</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Actual inventory cost of sold goods
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Based on unit purchase costs
          </div>
        </div>

        {/* 5. Gross Profit */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Gross Profit</div>
              <div className={`stat-card-value ${isGrossProfitable ? 'stat-profit' : 'stat-loss'}`}>
                {isGrossProfitable ? '🟢' : '🔴'} ₹{Math.abs(data.grossProfit || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="stat-card-icon">📊</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Profit from goods sold (Revenue − COGS)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {data.grossMargin ?? 0}% gross margin
          </div>
        </div>

        {/* 6. Net Profit/Loss */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Net Profit/Loss</div>
              <div className={`stat-card-value ${isProfitable ? 'stat-profit' : 'stat-loss'}`}>
                {isProfitable ? '🟢' : '🔴'} ₹{Math.abs(data.netProfit || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="stat-card-icon">{isProfitable ? '📈' : '📉'}</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Gross profit − Operating expenses
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {data.netProfitMargin ?? 0}% net margin
          </div>
        </div>
      </div>

      {/* SECTION B: TODAY'S SUMMARY (6 CARDS) */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h2>Today's Summary</h2>
        </div>
        <div className="dashboard-grid" style={{ marginBottom: 0 }}>
          {/* 1. Today's Sales */}
          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-card-label">Today's Sales</div>
                <div className="stat-card-value">₹{(data.todaysSales || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="stat-card-icon">💰</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {data.todaysSalesCount ?? 0} sales recorded today
            </div>
          </div>

          {/* 2. Today's Expenses */}
          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-card-label">Today's Expenses</div>
                <div className="stat-card-value">₹{(data.todaysExpenses || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="stat-card-icon">💸</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Purchases: ₹{(data.todaysInventoryExpenses || 0).toLocaleString('en-IN')} · Operating: ₹{(data.todaysOperatingExpenses || 0).toLocaleString('en-IN')}
            </div>
          </div>

          {/* 3. Today's Profit/Loss */}
          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-card-label">Today's Profit/Loss</div>
                <div className={`stat-card-value ${isTodaysNetProfitable ? 'stat-profit' : 'stat-loss'}`}>
                  {isTodaysNetProfitable ? '🟢' : '🔴'} ₹{Math.abs(data.todaysProfit || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="stat-card-icon">{isTodaysNetProfitable ? '📈' : '📉'}</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Today's Net: Gross profit − Operating
            </div>
          </div>

          {/* 4. Low Stock Products */}
          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-card-label">Low Stock Products</div>
                <div className={`stat-card-value ${data.lowStockCount > 0 ? 'stat-warning' : 'text-success'}`}>
                  {data.lowStockCount}
                </div>
              </div>
              <div className="stat-card-icon">⚠️</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {data.lowStockCount > 0 ? 'Items at or below reorder level' : 'All items sufficiently stocked'}
            </div>
          </div>

          {/* 5. Today's Cost of Goods Sold */}
          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-card-label">Today's Cost of Goods Sold</div>
                <div className="stat-card-value">₹{(data.todaysCogs || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="stat-card-icon">🏷️</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Cost of products sold today
            </div>
          </div>

          {/* 6. Today's Profit from Goods Sold */}
          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-card-label">Today's Profit from Goods Sold</div>
                <div className={`stat-card-value ${isTodaysGrossProfitable ? 'stat-profit' : 'stat-loss'}`}>
                  {isTodaysGrossProfitable ? '🟢' : '🔴'} ₹{Math.abs(data.todaysGrossProfit || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="stat-card-icon">📊</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {data.todaysGrossMargin ?? 0}% gross margin today
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
