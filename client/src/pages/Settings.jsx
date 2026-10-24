import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import PageHeader from '../components/PageHeader';
import defaultLogo from '../assets/prime-mart-logo.png';
import './Pages.css';

const MAX_LOGO_SIZE = 800 * 1024; // 800KB, keeps localStorage happy

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme, accent, accents, setAccent, logo, setLogo } = useSettings();
  const [copied, setCopied] = useState(false);
  const [logoError, setLogoError] = useState('');
  const fileInputRef = useRef(null);
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
  const isCustomLogo = logo && logo !== defaultLogo;

  // Account Security & Credentials state
  const [credEmail, setCredEmail] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credConfirmPassword, setCredConfirmPassword] = useState('');
  const [credSaving, setCredSaving] = useState(false);
  const [credSuccess, setCredSuccess] = useState('');
  const [credError, setCredError] = useState('');

  useEffect(() => {
    if (user?.email) {
      setCredEmail(user.email);
    }
  }, [user]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoError('');
    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file (PNG, JPG or SVG).');
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setLogoError('Please choose an image smaller than 800KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCredentialsUpdate = async (e) => {
    e.preventDefault();
    setCredError('');
    setCredSuccess('');

    if (credPassword) {
      if (credPassword.length < 6) {
        setCredError('Password must be at least 6 characters.');
        return;
      }
      if (credPassword !== credConfirmPassword) {
        setCredError('Passwords do not match.');
        return;
      }
    }

    try {
      setCredSaving(true);
      await updateProfile({
        email: credEmail,
        ...(credPassword ? { password: credPassword, confirmPassword: credConfirmPassword } : {})
      });
      setCredSuccess('Credentials updated successfully! You can now log in with your updated email and password.');
      setCredPassword('');
      setCredConfirmPassword('');
    } catch (err) {
      setCredError(err.response?.data?.message || err.message || 'Failed to update credentials.');
    } finally {
      setCredSaving(false);
    }
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

      {/* Account Security & Personal Credentials */}
      <div className="card">
        <div className="card-header">
          <h2>Account Security & Personal Credentials</h2>
        </div>
        <p className="mb-2" style={{ marginTop: '-8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Update your login email address and set your personal password. Credentials are encrypted and hashed with bcrypt in MongoDB.
        </p>

        {credSuccess && <div className="alert alert-success">{credSuccess}</div>}
        {credError && <div className="alert alert-danger">{credError}</div>}

        <form onSubmit={handleCredentialsUpdate}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Login Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="your.email@example.com"
                value={credEmail}
                onChange={(e) => setCredEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password (leave blank to keep current)</label>
              <input
                type="password"
                className="form-control"
                placeholder="Min. 6 characters"
                value={credPassword}
                onChange={(e) => setCredPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Re-enter new password"
                value={credConfirmPassword}
                onChange={(e) => setCredConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={credSaving}>
              {credSaving ? 'Updating Credentials…' : 'Save Credentials'}
            </button>
          </div>
        </form>
      </div>

      {/* Business Logo */}
      <div className="card">
        <div className="card-header">
          <h2>Business Logo</h2>
        </div>
        <p className="mb-2" style={{ marginTop: '-8px' }}>
          Upload your Prime Mart logo. It appears in the sidebar, header and on printed sale receipts.
        </p>
        <div className="logo-uploader">
          <div className="logo-preview">
            {logo ? <img src={logo} alt="Business logo preview" /> : <span>P</span>}
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                {isCustomLogo ? 'Change logo' : 'Upload your own logo'}
              </button>
              {isCustomLogo && <button className="btn btn-secondary" onClick={() => setLogo(defaultLogo)}>Reset to default logo</button>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleLogoChange}
            />
            {logoError && <p className="error-text">{logoError}</p>}
            {!logoError && <p style={{ fontSize: '12px', marginTop: '8px' }}>PNG, JPG or SVG · under 800KB · square images look best</p>}
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <div className="card-header">
          <h2>Appearance</h2>
        </div>
        <div className="form-group">
          <label className="form-label">Theme</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <span>{theme === 'dark' ? 'Dark mode is on' : 'Light mode is on'} — click to switch</span>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Accent colour</label>
          <div className="accent-swatches">
            {Object.entries(accents).map(([key, value]) => (
              <div className="accent-swatch-row" key={key}>
                <button
                  className={`accent-swatch ${accent === key ? 'active' : ''}`}
                  style={{ background: value.primary }}
                  onClick={() => setAccent(key)}
                  aria-label={`Use ${value.label} accent colour`}
                  title={value.label}
                />
                {value.label}
              </div>
            ))}
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
              value={apiBaseUrl}
              readOnly
            />
            <button
              className="btn btn-secondary"
              onClick={() => copyToClipboard(apiBaseUrl)}
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
