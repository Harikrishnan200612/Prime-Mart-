import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoMark from '../components/LogoMark';
import './AuthPages.css';

const hasBackend = Boolean(import.meta.env.VITE_API_URL);

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (import.meta.env.PROD && !hasBackend
          ? 'The backend API is not yet deployed. See the README for deployment instructions.'
          : 'Login failed. Please check your credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <LogoMark variant="auth-logo" />
            <h1>Prime Mart</h1>
            <p>Business Management System</p>
          </div>

          {/* Show backend status banner in production when no API URL is set */}
          {import.meta.env.PROD && !hasBackend && (
            <div className="alert alert-warning" style={{
              background: '#fff8e1',
              border: '1px solid #f9a825',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#5d4037'
            }}>
              <strong>⚠️ Backend Not Connected</strong><br />
              The live frontend is deployed on GitHub Pages. To log in, the
              Node.js backend must be deployed (e.g. on Render or Railway) and
              the <code>VITE_API_URL</code> repository variable must be set in
              GitHub Actions. See the{' '}
              <a
                href="https://github.com/Harikrishnan200612/Prime-Mart-#backend-deployment"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1565c0' }}
              >
                README
              </a>{' '}
              for instructions.
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                id="login-email"
                className="form-control"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                id="login-password"
                className="form-control"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              id="login-submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
