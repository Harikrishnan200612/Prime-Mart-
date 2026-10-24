/**
 * seed/seedAdminSalesBoost4.js
 *
 * Final wave of targeted high-margin sales to achieve Rs.3,000-5,000 net profit.
 * Focuses on high-margin products with good stock: Rice, OIL-5L, Rice 10kg, Atta, Wheat.
 */
'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const User    = require('../models/User');
const Product = require('../models/Product');
const Sale    = require('../models/Sale');
const Expense = require('../models/Expense');

const ADMIN_EMAIL = 'admin@primemart.com';
const MONGO_URI   = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartbiz';
const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

const oct = (day, hh = 10, mm = 0) => {
  const iso = `2026-10-${String(day).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+05:30`;
  return new Date(iso);
};

const run = async () => {
  console.log('\nConnecting to MongoDB …');
  await mongoose.connect(MONGO_URI);
  console.log('Connected\n');

  const user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (!user) { console.error('Admin user not found.'); process.exit(1); }
  const userId = user._id;

  const allProducts = await Product.find({ userId });
  const bySku = {};
  for (const p of allProducts) bySku[p.sku] = p;

  const line = (sku, qty) => {
    const p = bySku[sku];
    if (!p) throw new Error(`Unknown SKU: ${sku}`);
    return {
      productId  : p._id,
      productName: p.name,
      quantity   : qty,
      unitPrice  : p.sellingPrice,
      unitCost   : p.purchasePrice,
      subtotal   : round2(qty * p.sellingPrice),
      totalCost  : round2(qty * p.purchasePrice)
    };
  };

  // Final targeted wave: focus on high-margin products (Rice 5kg, Rice 10kg, OIL-5L, Atta, Wheat, Tea, OIL-1L)
  // Target: ~Rs.30,000 more sales with ~Rs.6,000 gross profit contribution
  const wave4Sales = [
    // Bulk/wholesale buyer visits
    { inv:'ADM-E001', date:oct(1,6,30),  customer:'Lakshmi Stores',    pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',4), line('OIL-1L-001',3), line('ATTA-5KG-001',2)] },
    { inv:'ADM-E002', date:oct(2,6,45),  customer:'Vijay Provision',   pay:'Card', discount:0,
      items:[line('RICE-10KG-001',2), line('OIL-5L-001',1), line('SUGAR-1KG-001',4)] },
    { inv:'ADM-E003', date:oct(3,6,30),  customer:'Saravana Stores',   pay:'Cash', discount:100,
      items:[line('RICE-5KG-001',4), line('WHEAT-2KG-001',3), line('OIL-1L-001',2)] },
    { inv:'ADM-E004', date:oct(4,6,45),  customer:'Murugan Traders',   pay:'UPI',  discount:0,
      items:[line('ATTA-5KG-001',3), line('RICE-5KG-001',3), line('TOOR-DAL-1KG-001',2)] },
    { inv:'ADM-E005', date:oct(5,6,30),  customer:'Ganesh Provision',  pay:'Cash', discount:0,
      items:[line('OIL-5L-001',2), line('RICE-10KG-001',2), line('SUN-OIL-1L-001',3)] },
    { inv:'ADM-E006', date:oct(6,6,45),  customer:'Krishnan Stores',   pay:'Cash', discount:50,
      items:[line('RICE-5KG-001',3), line('OIL-1L-001',3), line('MUSTARD-OIL-1L-001',2)] },
    { inv:'ADM-E007', date:oct(7,6,30),  customer:'Rajan Traders',     pay:'UPI',  discount:0,
      items:[line('WHEAT-2KG-001',4), line('ATTA-5KG-001',2), line('GREEN-TEA-25B-001',3)] },
    { inv:'ADM-E008', date:oct(8,6,45),  customer:'Subbu Provision',   pay:'Cash', discount:0,
      items:[line('RICE-10KG-001',2), line('SUGAR-1KG-001',6), line('JUICE-1L-001',4)] },
    { inv:'ADM-E009', date:oct(9,6,30),  customer:'Sridhar Stores',    pay:'Card', discount:100,
      items:[line('OIL-5L-001',2), line('RICE-5KG-001',3), line('WHEAT-2KG-001',3)] },
    { inv:'ADM-E010', date:oct(10,6,45), customer:'Anbu Traders',      pay:'Cash', discount:0,
      items:[line('ATTA-5KG-001',2), line('SUN-OIL-1L-001',3), line('TEA-250G-001',2)] },
    { inv:'ADM-E011', date:oct(11,6,30), customer:'Balaji Provision',  pay:'UPI',  discount:0,
      items:[line('RICE-5KG-001',4), line('OIL-1L-001',2), line('TOOR-DAL-1KG-001',2)] },
    { inv:'ADM-E012', date:oct(12,6,45), customer:'Chandra Stores',    pay:'Cash', discount:0,
      items:[line('RICE-10KG-001',2), line('OIL-5L-001',1), line('BASMATI-1KG-001',3)] },
    { inv:'ADM-E013', date:oct(13,6,30), customer:'Gopal Traders',     pay:'Cash', discount:50,
      items:[line('RICE-5KG-001',3), line('WHEAT-2KG-001',3), line('GREEN-TEA-25B-001',2)] },
    { inv:'ADM-E014', date:oct(14,6,45), customer:'Harish Provision',  pay:'UPI',  discount:0,
      items:[line('ATTA-5KG-001',2), line('MUSTARD-OIL-1L-001',2), line('COFFEE-200G-001',2)] },
    { inv:'ADM-E015', date:oct(15,6,30), customer:'Indra Stores',      pay:'Cash', discount:0,
      items:[line('OIL-5L-001',2), line('RICE-5KG-001',3), line('SUGAR-1KG-001',5)] },
    { inv:'ADM-E016', date:oct(16,6,45), customer:'Jagan Traders',     pay:'Card', discount:100,
      items:[line('RICE-10KG-001',1), line('WHEAT-2KG-001',3), line('KETCHUP-500G-001',3)] },
    { inv:'ADM-E017', date:oct(17,6,30), customer:'Karthik Provision', pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',3), line('OIL-1L-001',2), line('TEA-250G-001',2)] },
    { inv:'ADM-E018', date:oct(18,6,45), customer:'Logan Stores',      pay:'UPI',  discount:0,
      items:[line('ATTA-5KG-001',2), line('SUN-OIL-1L-001',2), line('JUICE-1L-001',3)] },
    { inv:'ADM-E019', date:oct(19,6,30), customer:'Mani Provision',    pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',2), line('WHEAT-2KG-001',2), line('BASMATI-1KG-001',2)] },
    { inv:'ADM-E020', date:oct(20,6,45), customer:'Nagu Traders',      pay:'Cash', discount:50,
      items:[line('OIL-5L-001',1), line('TOOR-DAL-1KG-001',2), line('TOOTHPASTE-150G-001',3)] },
  ];

  let inserted = 0, skipped = 0;

  for (const s of wave4Sales) {
    const existing = await Sale.findOne({ userId, invoiceNumber: s.inv });
    if (existing) { skipped++; process.stdout.write(`  skip  ${s.inv}\n`); continue; }

    const validItems = [];
    for (const item of s.items) {
      const prod = allProducts.find(p => p._id.toString() === item.productId.toString());
      if (!prod || prod.stock <= 0) {
        console.warn(`  WARN: ${item.productName} no stock`);
        continue;
      }
      const qty = Math.min(item.quantity, prod.stock);
      prod.stock -= qty;
      validItems.push({ ...item, quantity: qty, subtotal: round2(qty * item.unitPrice), totalCost: round2(qty * item.unitCost) });
    }

    if (validItems.length === 0) { skipped++; continue; }

    const subtotal    = round2(validItems.reduce((a, i) => a + i.subtotal, 0));
    const cogsAmount  = round2(validItems.reduce((a, i) => a + (i.totalCost || 0), 0));
    const totalAmount = round2(subtotal - (s.discount || 0));

    const maxSale = await Sale.findOne({ userId }).sort({ saleNumber: -1 });
    const nextNum = (maxSale?.saleNumber || 0) + 1;

    await Sale.create({
      userId,
      saleNumber      : nextNum,
      invoiceNumber   : s.inv,
      customerName    : s.customer,
      items           : validItems,
      subtotal,
      discount        : s.discount || 0,
      tax             : 0,
      totalAmount,
      costOfGoodsSold : cogsAmount,
      hasIncompleteCost: false,
      paymentMethod   : s.pay,
      date            : s.date,
      notes           : '[BOOST DATA] Regular business activity'
    });

    inserted++;
    process.stdout.write(`  + ${s.inv}  Rs.${totalAmount}  (margin Rs.${round2(totalAmount - cogsAmount)})\n`);
  }

  const totalSaleCount = await Sale.countDocuments({ userId });
  await User.updateOne({ _id: userId }, { $set: { saleCounter: totalSaleCount } });

  // Actual DB totals
  const salesAgg = await Sale.aggregate([
    { $match: { userId } },
    { $group: { _id: null, totalSales: { $sum: '$totalAmount' }, totalCogs: { $sum: '$costOfGoodsSold' } } }
  ]);
  const expAgg = await Expense.aggregate([
    { $match: { userId } },
    { $group: { _id: null,
      inventoryExp: { $sum: { $cond: [{ $in: ['$category', ['Stock Purchase','Inventory Purchase']] }, '$amount', 0] } },
      operatingExp: { $sum: { $cond: [{ $not: [{ $in: ['$category', ['Stock Purchase','Inventory Purchase']] }] }, '$amount', 0] } }
    } }
  ]);

  const dbSales  = salesAgg[0]?.totalSales || 0;
  const dbCogs   = salesAgg[0]?.totalCogs  || 0;
  const invEx    = expAgg[0]?.inventoryExp  || 0;
  const opEx     = expAgg[0]?.operatingExp  || 0;
  const grossP   = dbSales - dbCogs;
  const netP     = grossP - opEx;
  const margin   = dbSales > 0 ? ((netP / dbSales) * 100).toFixed(1) : '0';

  console.log('\n════════════════════════════════════════════');
  console.log('        FINAL FINANCIAL SUMMARY');
  console.log('════════════════════════════════════════════');
  console.log(`  Inserted: ${inserted}  |  Skipped: ${skipped}`);
  console.log('');
  console.log(`  Total Sales:         Rs.${round2(dbSales)}`);
  console.log(`  Inventory Purchases: Rs.${round2(invEx)}  (asset - not subtracted)`);
  console.log(`  Cost of Goods Sold:  Rs.${round2(dbCogs)}`);
  console.log(`  Gross Profit:        Rs.${round2(grossP)}`);
  console.log(`  Operating Expenses:  Rs.${round2(opEx)}`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Net Profit:          Rs.${round2(netP)}  ${netP > 0 ? '<-- POSITIVE ✓ TARGET MET' : '<-- still negative'}`);
  console.log(`  Net Margin:          ${margin}%`);
  console.log(`  Total Sales Count:   ${totalSaleCount}`);
  console.log('════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('FAILED:', err.message || err);
  mongoose.disconnect().finally(() => process.exit(1));
});
