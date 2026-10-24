/**
 * seed/seedAdminSalesBoost2.js
 *
 * Second wave of sales to push Prime Mart into positive net profit.
 * Idempotent – skips any invoice that already exists.
 */
'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const User    = require('../models/User');
const Product = require('../models/Product');
const Sale    = require('../models/Sale');

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

  // Wave 2: another 50 sales, spread across different days/times
  // Focus on high-margin and well-stocked products
  const wave2Sales = [
    // Oct 1 - additional afternoon sales
    { inv:'ADM-C001', date:oct(1,18,0),  customer:'Kamala Devi',       pay:'Cash', discount:0,
      items:[line('RICE-10KG-001',1), line('SUGAR-1KG-001',3), line('OIL-1L-001',2)] },

    // Oct 2 - additional
    { inv:'ADM-C002', date:oct(2,11,30), customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('TEA-250G-001',2), line('COFFEE-200G-001',1), line('WATER-1L-001',10)] },
    { inv:'ADM-C003', date:oct(2,18,0),  customer:'Arun Krishnan',     pay:'Cash', discount:0,
      items:[line('WHEAT-2KG-001',3), line('CHANA-DAL-1KG-001',2), line('SALT-1KG-001',3)] },

    // Oct 3 - additional
    { inv:'ADM-C004', date:oct(3,8,30),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('NOODLES-4PK-001',4), line('CHIPS-50G-001',5), line('PEANUTS-200G-001',3)] },
    { inv:'ADM-C005', date:oct(3,18,30), customer:'Vijaya Lakshmi',    pay:'UPI',  discount:0,
      items:[line('TOOTHPASTE-150G-001',2), line('SHAMPOO-180ML-001',1), line('SOAP-100G-001',3)] },

    // Oct 4 - additional
    { inv:'ADM-C006', date:oct(4,8,15),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',2), line('OIL-1L-001',2), line('SUGAR-1KG-001',3)] },
    { inv:'ADM-C007', date:oct(4,18,45), customer:'Senthil Kumar',     pay:'Cash', discount:0,
      items:[line('BASMATI-1KG-001',3), line('URAD-DAL-1KG-001',2), line('KETCHUP-500G-001',2)] },

    // Oct 5 - additional
    { inv:'ADM-C008', date:oct(5,8,0),   customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('JUICE-1L-001',5), line('WATER-1L-001',8), line('GREEN-TEA-25B-001',1)] },

    // Oct 6 - additional
    { inv:'ADM-C009', date:oct(6,8,30),  customer:'Mangala Priya',     pay:'Cash', discount:0,
      items:[line('ATTA-5KG-001',2), line('MOONG-DAL-1KG-001',2), line('SUN-OIL-1L-001',2)] },
    { inv:'ADM-C010', date:oct(6,18,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-10KG-001',1), line('WHEAT-2KG-001',2), line('SALT-1KG-001',4)] },

    // Oct 7 - additional
    { inv:'ADM-C011', date:oct(7,8,15),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('BUTTER-100G-001',2), line('PANEER-200G-001',1), line('MILK-500ML-002',4)] },
    { inv:'ADM-C012', date:oct(7,18,30), customer:'Naresh Babu',       pay:'UPI',  discount:0,
      items:[line('DETERGENT-1KG-001',1), line('DISHWASH-500ML-001',2), line('FLOOR-CLEANER-1L-001',1)] },

    // Oct 8 - additional
    { inv:'ADM-C013', date:oct(8,8,30),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',3), line('OIL-1L-001',2), line('TOOR-DAL-1KG-001',2)] },
    { inv:'ADM-C014', date:oct(8,18,15), customer:'Savitha Menon',     pay:'Card', discount:0,
      items:[line('CHIPS-50G-001',5), line('NOODLES-4PK-001',4), line('PEANUTS-200G-001',3)] },

    // Oct 9 - additional
    { inv:'ADM-C015', date:oct(9,8,0),   customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('SUGAR-1KG-001',5), line('SALT-1KG-001',3), line('WHEAT-2KG-001',2)] },
    { inv:'ADM-C016', date:oct(9,18,45), customer:'Krishnamurthy',     pay:'UPI',  discount:50,
      items:[line('OIL-5L-001',1), line('BASMATI-1KG-001',2), line('MUSTARD-OIL-1L-001',1)] },

    // Oct 10 - additional
    { inv:'ADM-C017', date:oct(10,8,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',2), line('CHANA-DAL-1KG-001',2), line('KETCHUP-500G-001',2)] },
    { inv:'ADM-C018', date:oct(10,18,30),customer:'Kavitha Krishnan',  pay:'Cash', discount:0,
      items:[line('GREEN-TEA-25B-001',2), line('JUICE-1L-001',3), line('WATER-1L-001',6)] },

    // Oct 11 - additional
    { inv:'ADM-C019', date:oct(11,8,15), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('TOOTHPASTE-150G-001',3), line('SHAMPOO-180ML-001',2), line('SOAP-100G-001',3)] },
    { inv:'ADM-C020', date:oct(11,18,30),customer:'Sridevi Nair',      pay:'UPI',  discount:0,
      items:[line('ATTA-5KG-001',2), line('TOOR-DAL-1KG-001',2), line('SUN-OIL-1L-001',2)] },

    // Oct 12 - additional
    { inv:'ADM-C021', date:oct(12,8,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-10KG-001',1), line('SUGAR-1KG-001',4), line('SALT-1KG-001',3)] },
    { inv:'ADM-C022', date:oct(12,18,0), customer:'Bharath Reddy',     pay:'Card', discount:100,
      items:[line('DETERGENT-1KG-001',1), line('FLOOR-CLEANER-1L-001',1), line('DISHWASH-500ML-001',2)] },

    // Oct 13 - additional
    { inv:'ADM-C023', date:oct(13,8,0),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('NOODLES-4PK-001',5), line('CHIPS-50G-001',6), line('JUICE-1L-001',4)] },
    { inv:'ADM-C024', date:oct(13,18,15),customer:'Nalini Suresh',     pay:'UPI',  discount:0,
      items:[line('BUTTER-100G-001',2), line('MILK-500ML-002',3), line('PANEER-200G-001',1)] },

    // Oct 14 - additional
    { inv:'ADM-C025', date:oct(14,8,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('WHEAT-2KG-001',3), line('MOONG-DAL-1KG-001',2), line('URAD-DAL-1KG-001',2)] },
    { inv:'ADM-C026', date:oct(14,18,30),customer:'Ganesh Iyer',       pay:'Cash', discount:0,
      items:[line('TEA-250G-001',1), line('COFFEE-200G-001',1), line('GREEN-TEA-25B-001',2)] },

    // Oct 15 - additional
    { inv:'ADM-C027', date:oct(15,8,0),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('OIL-5L-001',1), line('MUSTARD-OIL-1L-001',2), line('SALT-1KG-001',4)] },
    { inv:'ADM-C028', date:oct(15,18,30),customer:'Lakshmi Priya',     pay:'UPI',  discount:50,
      items:[line('TOOTHPASTE-150G-001',3), line('SHAMPOO-180ML-001',2), line('SOAP-100G-001',2)] },

    // Oct 16 - additional
    { inv:'ADM-C029', date:oct(16,8,15), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',2), line('SUGAR-1KG-001',4), line('CHANA-DAL-1KG-001',2)] },
    { inv:'ADM-C030', date:oct(16,18,30),customer:'Ravi Shankar',      pay:'Card', discount:0,
      items:[line('JUICE-1L-001',4), line('WATER-1L-001',8), line('PEANUTS-200G-001',3)] },

    // Oct 17 - additional
    { inv:'ADM-C031', date:oct(17,8,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('BASMATI-1KG-001',2), line('KETCHUP-500G-001',2), line('SALT-1KG-001',2)] },
    { inv:'ADM-C032', date:oct(17,18,15),customer:'Vijay Shankar',     pay:'UPI',  discount:0,
      items:[line('NOODLES-4PK-001',4), line('CHIPS-50G-001',5), line('WATER-1L-001',6)] },

    // Oct 18 - additional
    { inv:'ADM-C033', date:oct(18,8,0),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',2), line('OIL-1L-001',2), line('TOOR-DAL-1KG-001',2)] },
    { inv:'ADM-C034', date:oct(18,18,30),customer:'Uma Devi',          pay:'Cash', discount:0,
      items:[line('BUTTER-100G-001',2), line('PANEER-200G-001',1), line('GREEN-TEA-25B-001',1)] },

    // Oct 19 - additional
    { inv:'ADM-C035', date:oct(19,8,30), customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('ATTA-5KG-001',2), line('SUN-OIL-1L-001',2), line('URAD-DAL-1KG-001',1)] },
    { inv:'ADM-C036', date:oct(19,18,0), customer:'Ramakrishnan',      pay:'Cash', discount:0,
      items:[line('DETERGENT-1KG-001',1), line('SOAP-100G-001',3), line('TOOTHPASTE-150G-001',2)] },

    // Oct 20 - additional
    { inv:'ADM-C037', date:oct(20,8,15), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-10KG-001',1), line('SUGAR-1KG-001',3), line('SALT-1KG-001',3)] },
    { inv:'ADM-C038', date:oct(20,18,30),customer:'Sindhu Menon',      pay:'UPI',  discount:0,
      items:[line('JUICE-1L-001',3), line('WATER-1L-001',8), line('CHIPS-50G-001',5)] },

    // Oct 21 - additional
    { inv:'ADM-C039', date:oct(21,8,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('WHEAT-2KG-001',2), line('CHANA-DAL-1KG-001',2), line('KETCHUP-500G-001',2)] },
    { inv:'ADM-C040', date:oct(21,18,30),customer:'Hari Kumar',        pay:'Card', discount:50,
      items:[line('MUSTARD-OIL-1L-001',2), line('BASMATI-1KG-001',2), line('MOONG-DAL-1KG-001',1)] },

    // Oct 22-24 (additional transactions before existing ones)
    { inv:'ADM-C041', date:oct(22,8,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',2), line('SUGAR-1KG-001',3), line('SALT-1KG-001',3)] },
    { inv:'ADM-C042', date:oct(22,18,0), customer:'Preethi Narayanan', pay:'UPI',  discount:0,
      items:[line('NOODLES-4PK-001',4), line('PEANUTS-200G-001',3), line('WATER-1L-001',5)] },
    { inv:'ADM-C043', date:oct(23,8,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('OIL-1L-001',2), line('TOOR-DAL-1KG-001',2), line('ATTA-5KG-001',1)] },
    { inv:'ADM-C044', date:oct(23,18,0), customer:'Shanmugam',         pay:'Cash', discount:0,
      items:[line('JUICE-1L-001',4), line('GREEN-TEA-25B-001',1), line('COFFEE-200G-001',1)] },
    { inv:'ADM-C045', date:oct(24,8,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',2), line('WHEAT-2KG-001',2), line('SUGAR-1KG-001',3)] },
    { inv:'ADM-C046', date:oct(24,11,0), customer:'Saroja Devi',       pay:'UPI',  discount:50,
      items:[line('SUN-OIL-1L-001',2), line('URAD-DAL-1KG-001',1), line('KETCHUP-500G-001',2)] },
    { inv:'ADM-C047', date:oct(24,15,0), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('CHIPS-50G-001',5), line('NOODLES-4PK-001',3), line('PEANUTS-200G-001',3)] },
    { inv:'ADM-C048', date:oct(24,17,30),customer:'Manjula Krishnan',  pay:'Card', discount:0,
      items:[line('TOOTHPASTE-150G-001',2), line('SHAMPOO-180ML-001',1), line('SOAP-100G-001',2)] },
    { inv:'ADM-C049', date:oct(24,18,30),customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('BUTTER-100G-001',2), line('MILK-500ML-002',3), line('JUICE-1L-001',3)] },
    { inv:'ADM-C050', date:oct(24,19,0), customer:'Mohan Das',         pay:'UPI',  discount:0,
      items:[line('BASMATI-1KG-001',2), line('MUSTARD-OIL-1L-001',1), line('CHANA-DAL-1KG-001',2)] },
  ];

  let inserted = 0, skipped = 0, totalRevenue = 0, totalCogs = 0;

  for (const s of wave2Sales) {
    const existing = await Sale.findOne({ userId, invoiceNumber: s.inv });
    if (existing) { skipped++; process.stdout.write(`  skip  ${s.inv}\n`); continue; }

    const validItems = [];
    for (const item of s.items) {
      const prod = allProducts.find(p => p._id.toString() === item.productId.toString());
      if (!prod || prod.stock <= 0) {
        console.warn(`  WARN: ${item.productName} has no stock, skipping from ${s.inv}`);
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

    totalRevenue += totalAmount;
    totalCogs    += cogsAmount;
    inserted++;
    process.stdout.write(`  + ${s.inv}  Rs.${totalAmount}  (margin Rs.${round2(totalAmount - cogsAmount)})\n`);
  }

  const totalSaleCount = await Sale.countDocuments({ userId });
  await User.updateOne({ _id: userId }, { $set: { saleCounter: totalSaleCount } });

  // Get current totals from DB
  const salesAgg = await Sale.aggregate([
    { $match: { userId } },
    { $group: { _id: null, totalSales: { $sum: '$totalAmount' }, totalCogs: { $sum: '$costOfGoodsSold' } } }
  ]);
  const Expense = require('../models/Expense');
  const expAgg = await Expense.aggregate([
    { $match: { userId } },
    { $group: { _id: null,
      operatingExp: { $sum: { $cond: [{ $not: [{ $in: ['$category', ['Stock Purchase','Inventory Purchase']] }] }, '$amount', 0] } }
    } }
  ]);

  const dbSales = salesAgg[0]?.totalSales || 0;
  const dbCogs  = salesAgg[0]?.totalCogs  || 0;
  const opEx    = expAgg[0]?.operatingExp  || 0;
  const grossP  = dbSales - dbCogs;
  const netP    = grossP - opEx;

  console.log('\n═══════════════════════════════════════');
  console.log('         WAVE 2 BOOST COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`  Inserted:      ${inserted}  |  Skipped: ${skipped}`);
  console.log(`\n  ACTUAL Dashboard Values (from DB):`);
  console.log(`  Total Sales:   Rs.${round2(dbSales)}`);
  console.log(`  Total COGS:    Rs.${round2(dbCogs)}`);
  console.log(`  Gross Profit:  Rs.${round2(grossP)}`);
  console.log(`  Op Expenses:   Rs.${round2(opEx)}`);
  console.log(`  Net Profit:    Rs.${round2(netP)}  ${netP > 0 ? '<-- POSITIVE ✓' : '<-- still negative'}`);
  console.log(`  Net Margin:    ${dbSales > 0 ? ((netP / dbSales) * 100).toFixed(1) : '0'}%`);
  console.log(`  Sales count:   ${totalSaleCount}`);
  console.log('═══════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('FAILED:', err.message || err);
  mongoose.disconnect().finally(() => process.exit(1));
});
