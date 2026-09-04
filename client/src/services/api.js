import axios from 'axios';

// Use the Vite dev proxy locally and configure VITE_API_URL for a deployed API.
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Service
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Dashboard Service
export const dashboardService = {
  getSummary: () => api.get('/dashboard')
};

// Product Service
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  increaseStock: (id, data) => api.post(`/products/${id}/increase-stock`, data),
  decreaseStock: (id, data) => api.post(`/products/${id}/decrease-stock`, data)
};

// Sale Service
export const saleService = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`)
};

// Expense Service
export const expenseService = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`)
};

// Staff Service
export const staffService = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`)
};

// Reports Service
export const reportsService = {
  getSalesReport: (params) => api.get('/reports/sales', { params }),
  getExpensesReport: (params) => api.get('/reports/expenses', { params }),
  getProfitReport: (params) => api.get('/reports/profit', { params }),
  getPaymentMethodsReport: (params) => api.get('/reports/payment-methods', { params }),
  getTopProducts: (params) => api.get('/reports/top-products', { params })
};

export default api;
