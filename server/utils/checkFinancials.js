'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const User = require('../models/User');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartbiz';

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected\n');

  const users = await User.find({}, 'email _id');
  console.log('=== Users ===');
  users.forEach(u => console.log(' -', u.email, '|', u._id));

  for (const user of users) {
    console.log(`\n=== Financials for ${user.email} ===`);

    const salesAgg = await Sale.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' }, totalCogs: { $sum: '$costOfGoodsSold' }, count: { $sum: 1 } } }
    ]);
    const sa = salesAgg[0] || {};
    console.log(`  Sales count  : ${sa.count || 0}`);
    console.log(`  Total Sales  : Rs.${(sa.totalSales || 0).toFixed(2)}`);
    console.log(`  Total COGS   : Rs.${(sa.totalCogs || 0).toFixed(2)}`);
    console.log(`  Gross Profit : Rs.${((sa.totalSales || 0) - (sa.totalCogs || 0)).toFixed(2)}`);

    const expAgg = await Expense.aggregate([
      { $match: { userId: user._id } },
      { $group: {
        _id: null,
        total: { $sum: '$amount' },
        inventoryExp: { $sum: { $cond: [{ $in: ['$category', ['Stock Purchase','Inventory Purchase']] }, '$amount', 0] } },
        operatingExp: { $sum: { $cond: [{ $not: [{ $in: ['$category', ['Stock Purchase','Inventory Purchase']] }] }, '$amount', 0] } }
      } }
    ]);
    const ea = expAgg[0] || {};
    console.log(`  Inventory Ex : Rs.${(ea.inventoryExp || 0).toFixed(2)}`);
    console.log(`  Operating Ex : Rs.${(ea.operatingExp || 0).toFixed(2)}`);

    const grossProfit = (sa.totalSales || 0) - (sa.totalCogs || 0);
    const netProfit = grossProfit - (ea.operatingExp || 0);
    console.log(`  Net Profit   : Rs.${netProfit.toFixed(2)}`);

    const prods = await Product.countDocuments({ userId: user._id });
    console.log(`  Products     : ${prods}`);

    // List recent sales
    const recentSales = await Sale.find({ userId: user._id }).sort({ date: -1 }).limit(5);
    console.log('  Recent sales:');
    recentSales.forEach(s => console.log(`    ${s.invoiceNumber || s.saleNumber} | Rs.${s.totalAmount} | COGS Rs.${s.costOfGoodsSold || 0} | ${s.date?.toISOString?.().slice(0,10)}`));

    // List expenses
    const expenses = await Expense.find({ userId: user._id }, 'category amount description');
    console.log('  Expenses:');
    expenses.forEach(e => console.log(`    [${e.category}] Rs.${e.amount} - ${e.description}`));
  }

  await mongoose.disconnect();
};

run().catch(err => { console.error(err.message); process.exit(1); });
