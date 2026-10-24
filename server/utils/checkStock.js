'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartbiz');
  const user = await User.findOne({ email: 'admin@primemart.com' });
  const prods = await Product.find({ userId: user._id, stock: { $gt: 0 } }, 'name sku sellingPrice purchasePrice stock')
    .sort({ stock: -1 });
  console.log('Products with remaining stock:');
  prods.forEach(p => {
    const margin = p.sellingPrice - p.purchasePrice;
    console.log(`  ${p.sku} | ${p.name} | stock:${p.stock} | sell:${p.sellingPrice} | margin:${margin} | max revenue:${p.stock * p.sellingPrice}`);
  });
  await mongoose.disconnect();
};
run().catch(e => { console.error(e.message); process.exit(1); });
