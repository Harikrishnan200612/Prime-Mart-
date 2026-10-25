require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.FRONTEND_URLS || 'http://localhost:5173,https://harikrishnan200612.github.io')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Middleware
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.includes(normalized) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartbiz')
  .then(async () => {
    console.log('✓ MongoDB connected');
    const converted = await require('./utils/migrateLegacySales')();
    if (converted) console.log(`✓ Converted ${converted} older sale(s) to the multi-product format`);
    const costMigration = await require('./utils/migrateHistoricalSalesCost')();
    if (costMigration && costMigration.updated) console.log(`✓ Reconstructed cost snapshots for ${costMigration.updated} sale(s)`);
    const productSeed = await require('./utils/seedAdditionalProducts')();
    if (productSeed && productSeed.inserted) console.log(`✓ Seeded ${productSeed.inserted} additional product(s) into inventory`);
  })
  .catch(err => console.error('✗ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/products', require('./routes/products'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'Prime Mart API is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:5173\n`);
});

module.exports = app;
