import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '▦', tone: 'dashboard' },
  { path: '/sales', label: 'Sales', icon: '↗', tone: 'sales' },
  { path: '/expenses', label: 'Expenses', icon: '−', tone: 'expenses' },
  { path: '/inventory', label: 'Inventory', icon: '□', tone: 'inventory' },
  { path: '/staff', label: 'Staff', icon: '♙', tone: 'staff' },
  { path: '/reports', label: 'Reports', icon: '⌁', tone: 'reports' },
  { path: '/settings', label: 'Settings', icon: '⚙', tone: 'settings' }
];

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentItem = menuItems.find((item) => item.path === location.pathname);

  return (
    <div className="layout">
      <header className="mobile-header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
          <span />
          <span />
          <span />
        </button>
        <strong>Prime Mart</strong>
      </header>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-mark">P</div>
          <div>
            <h2>Prime Mart</h2>
            <span>Business Management System</span>
          </div>
        </div>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${item.tone} ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.businessName?.[0] || 'P'}</div>
            <div className="user-details">
              <p className="user-business">{user?.businessName || 'Your business'}</p>
              <p className="user-email">{user?.email || ''}</p>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">
        <header className="app-header">
          <div className="breadcrumb">
            <span>Prime Mart</span>
            <b>/</b>
            <strong>{currentItem?.label || 'Workspace'}</strong>
          </div>
          <div className="header-actions">
            <div className="header-search"><span>⌕</span><input aria-label="Search workspace" placeholder="Search workspace..." /></div>
            <button className="notification-button" aria-label="Notifications"><span>♧</span><i /></button>
            <div className="header-user"><div className="header-avatar">{user?.businessName?.[0] || 'P'}</div><span>{user?.businessName || 'Prime Mart'}</span></div>
          </div>
        </header>
        <div className="content-wrapper">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
