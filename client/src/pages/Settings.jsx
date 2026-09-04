import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import './Pages.css';

const Settings = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page">
      <PageHeader tone="settings" icon="⚙" title="Settings" subtitle="Manage your account and preferences" />

      {/* Business Information */}
      <div className="card">
        <div className="card-header">
          <h2>Business Information</h2>
        </div>
        <div className="stats-row">
          <div className="stat-box success">
            <div className="stat-label">Business Name</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '8px' }}>
              {user?.businessName}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Owner Name</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '8px' }}>
              {user?.ownerName}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Email</div>
            <div style={{ fontSize: '14px', marginTop: '8px', wordBreak: 'break-all' }}>
              {user?.email}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Phone</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '8px' }}>
              {user?.phone}
            </div>
          </div>
        </div>
      </div>

      {/* API Information */}
      <div className="card">
        <div className="card-header">
          <h2>API Integration</h2>
        </div>
        <div className="form-group">
          <label className="form-label">API Base URL</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="form-control"
              value="http://localhost:5000/api"
              readOnly
            />
            <button
              className="btn btn-secondary"
              onClick={() => copyToClipboard('http://localhost:5000/api')}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Settings;
