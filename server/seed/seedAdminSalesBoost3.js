/**
 * seed/seedAdminSalesBoost3.js
 *
 * Third wave - targeted sales to push Prime Mart into positive net profit.
 * We need approximately Rs.9,000 more gross profit.
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

  // Wave 3: 40 more sales focusing on high-margin products with available stock
  // Need ~Rs.9,000 more gross profit, so ~Rs.35,000 in additional sales
  const wave3Sales = [
    // Oct 1 - extra early morning runs
    { inv:'ADM-D001', date:oct(1,7,30),  customer:'Wholesale Buyer',   pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',3), line('SUGAR-1KG-001',5), line('OIL-1L-001',3)] },
    { inv:'ADM-D002', date:oct(1,19,0),  customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('NOODLES-4PK-001',4), line('WATER-1L-001',8), line('SALT-1KG-001',2)] },

    // Oct 2
    { inv:'ADM-D003', date:oct(2,7,45),  customer:'Subramanian',       pay:'Cash', discount:0,
      items:[line('WHEAT-2KG-001',3), line('TOOR-DAL-1KG-001',2), line('SUN-OIL-1L-001',2)] },
    { inv:'ADM-D004', date:oct(2,19,15), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('CHIPS-50G-001',6), line('PEANUTS-200G-001',4), line('JUICE-1L-001',3)] },

    // Oct 3
    { inv:'ADM-D005', date:oct(3,7,0),   customer:'Ganesan',           pay:'Cash', discount:0,
      items:[line('ATTA-5KG-001',2), line('BASMATI-1KG-001',2), line('MOONG-DAL-1KG-001',2)] },
    { inv:'ADM-D006', date:oct(3,19,30), customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('TOOTHPASTE-150G-001',2), line('SHAMPOO-180ML-001',2), line('DISHWASH-500ML-001',2)] },

    // Oct 4
    { inv:'ADM-D007', date:oct(4,7,30),  customer:'Murugan Store',     pay:'Cash', discount:0,
      items:[line('OIL-5L-001',1), line('SUGAR-1KG-001',4), line('WHEAT-2KG-001',2)] },
    { inv:'ADM-D008', date:oct(4,19,0),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('GREEN-TEA-25B-001',1), line('JUICE-1L-001',3), line('WATER-1L-001',6)] },

    // Oct 5
    { inv:'ADM-D009', date:oct(5,7,15),  customer:'Rajamani',          pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',2), line('OIL-1L-001',2), line('CHANA-DAL-1KG-001',2)] },
    { inv:'ADM-D010', date:oct(5,19,30), customer:'Walk-in Customer',  pay:'UPI',  discount:50,
      items:[line('BUTTER-100G-001',2), line('MILK-500ML-002',3), line('KETCHUP-500G-001',2)] },

    // Oct 6
    { inv:'ADM-D011', date:oct(6,7,0),   customer:'Selvam Traders',    pay:'Cash', discount:0,
      items:[line('SALT-1KG-001',5), line('MUSTARD-OIL-1L-001',2), line('URAD-DAL-1KG-001',2)] },
    { inv:'ADM-D012', date:oct(6,19,15), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('NOODLES-4PK-001',4), line('CHIPS-50G-001',4), line('PEANUTS-200G-001',3)] },

    // Oct 7
    { inv:'ADM-D013', date:oct(7,7,30),  customer:'Muthu Kumar',       pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',3), line('TOOR-DAL-1KG-001',2), line('SUGAR-1KG-001',3)] },
    { inv:'ADM-D014', date:oct(7,19,0),  customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('SOAP-100G-001',2), line('FLOOR-CLEANER-1L-001',1), line('DISHWASH-500ML-001',2)] },

    // Oct 8
    { inv:'ADM-D015', date:oct(8,7,15),  customer:'Balakrishnan',      pay:'Cash', discount:0,
      items:[line('ATTA-5KG-001',2), line('SUN-OIL-1L-001',2), line('WHEAT-2KG-001',2)] },
    { inv:'ADM-D016', date:oct(8,19,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('JUICE-1L-001',3), line('WATER-1L-001',5), line('SALT-1KG-001',2)] },

    // Oct 9
    { inv:'ADM-D017', date:oct(9,7,0),   customer:'Mani Stores',       pay:'Cash', discount:0,
      items:[line('BASMATI-1KG-001',2), line('MOONG-DAL-1KG-001',2), line('KETCHUP-500G-001',2)] },
    { inv:'ADM-D018', date:oct(9,19,15), customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('TOOTHPASTE-150G-001',2), line('SHAMPOO-180ML-001',1), line('GREEN-TEA-25B-001',1)] },

    // Oct 10
    { inv:'ADM-D019', date:oct(10,7,30), customer:'Periyasamy',        pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',3), line('OIL-1L-001',2), line('SUGAR-1KG-001',3)] },
    { inv:'ADM-D020', date:oct(10,19,0), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('CHANA-DAL-1KG-001',2), line('URAD-DAL-1KG-001',2), line('SALT-1KG-001',2)] },

    // Oct 11
    { inv:'ADM-D021', date:oct(11,7,15), customer:'Kannan Stores',     pay:'Cash', discount:0,
      items:[line('WHEAT-2KG-001',2), line('MUSTARD-OIL-1L-001',1), line('TOOR-DAL-1KG-001',2)] },
    { inv:'ADM-D022', date:oct(11,19,30),customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('BUTTER-100G-001',2), line('PANEER-200G-001',1), line('JUICE-1L-001',2)] },

    // Oct 12
    { inv:'ADM-D023', date:oct(12,7,0),  customer:'Sekar',             pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',2), line('SUGAR-1KG-001',3), line('OIL-1L-001',2)] },
    { inv:'ADM-D024', date:oct(12,19,15),customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('NOODLES-4PK-001',3), line('CHIPS-50G-001',4), line('WATER-1L-001',5)] },

    // Oct 13
    { inv:'ADM-D025', date:oct(13,7,30), customer:'Thangaraj',         pay:'Cash', discount:0,
      items:[line('SUN-OIL-1L-001',2), line('ATTA-5KG-001',1), line('MOONG-DAL-1KG-001',1)] },
    { inv:'ADM-D026', date:oct(13,19,0), customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('GREEN-TEA-25B-001',1), line('COFFEE-200G-001',1), line('WATER-1L-001',5)] },

    // Oct 14
    { inv:'ADM-D027', date:oct(14,7,15), customer:'Mudaliar',          pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',2), line('TOOR-DAL-1KG-001',2), line('WHEAT-2KG-001',2)] },
    { inv:'ADM-D028', date:oct(14,19,30),customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('DETERGENT-1KG-001',1), line('SOAP-100G-001',2), line('DISHWASH-500ML-001',1)] },

    // Oct 15
    { inv:'ADM-D029', date:oct(15,7,0),  customer:'Govindan',          pay:'Cash', discount:0,
      items:[line('SUGAR-1KG-001',4), line('SALT-1KG-001',3), line('OIL-1L-001',2)] },
    { inv:'ADM-D030', date:oct(15,19,15),customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('JUICE-1L-001',3), line('PEANUTS-200G-001',3), line('CHIPS-50G-001',3)] },

    // Oct 16
    { inv:'ADM-D031', date:oct(16,7,30), customer:'Damodaran',         pay:'Cash', discount:0,
      items:[line('BASMATI-1KG-001',2), line('URAD-DAL-1KG-001',2), line('KETCHUP-500G-001',2)] },
    { inv:'ADM-D032', date:oct(16,19,0), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('WHEAT-2KG-001',2), line('CHANA-DAL-1KG-001',2), line('MUSTARD-OIL-1L-001',1)] },

    // Oct 17-21
    { inv:'ADM-D033', date:oct(17,7,30), customer:'Krishnaswamy',      pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',2), line('SUGAR-1KG-001',3), line('OIL-1L-001',2)] },
    { inv:'ADM-D034', date:oct(18,7,15), customer:'Shanmugam',         pay:'Cash', discount:0,
      items:[line('TOOR-DAL-1KG-001',2), line('ATTA-5KG-001',1), line('SALT-1KG-001',3)] },
    { inv:'ADM-D035', date:oct(19,7,30), customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('JUICE-1L-001',3), line('WATER-1L-001',5), line('GREEN-TEA-25B-001',1)] },
    { inv:'ADM-D036', date:oct(20,7,15), customer:'Rajan Pillai',      pay:'Cash', discount:0,
      items:[line('WHEAT-2KG-001',2), line('SUN-OIL-1L-001',2), line('MOONG-DAL-1KG-001',1)] },
    { inv:'ADM-D037', date:oct(21,7,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('SUGAR-1KG-001',4), line('SALT-1KG-001',3), line('CHANA-DAL-1KG-001',2)] },
    { inv:'ADM-D038', date:oct(22,7,15), customer:'Parthiban',         pay:'Cash', discount:0,
      items:[line('BASMATI-1KG-001',2), line('MUSTARD-OIL-1L-001',1), line('KETCHUP-500G-001',2)] },
    { inv:'ADM-D039', date:oct(23,7,30), customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('NOODLES-4PK-001',4), line('CHIPS-50G-001',4), line('PEANUTS-200G-001',3)] },
    { inv:'ADM-D040', date:oct(24,7,15), customer:'Mahendran',         pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',2), line('OIL-1L-001',2), line('SUGAR-1KG-001',3)] },
  ];

  let inserted = 0, skipped = 0;

  for (const s of wave3Sales) {
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
      operatingExp: { $sum: { $cond: [{ $not: [{ $in: ['$category', ['Stock Purchase','Inventory Purchase']] }] }, '$amount', 0] } }
    } }
  ]);

  const dbSales = salesAgg[0]?.totalSales || 0;
  const dbCogs  = salesAgg[0]?.totalCogs  || 0;
  const opEx    = expAgg[0]?.operatingExp  || 0;
  const grossP  = dbSales - dbCogs;
  const netP    = grossP - opEx;

  console.log('\n═══════════════════════════════════════');
  console.log('         WAVE 3 BOOST COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`  Inserted: ${inserted}  |  Skipped: ${skipped}`);
  console.log(`\n  ACTUAL Dashboard Values (from DB):`);
  console.log(`  Total Sales:   Rs.${round2(dbSales)}`);
  console.log(`  Total COGS:    Rs.${round2(dbCogs)}`);
  console.log(`  Gross Profit:  Rs.${round2(grossP)}`);
  console.log(`  Op Expenses:   Rs.${round2(opEx)}`);
  console.log(`  Net Profit:    Rs.${round2(netP)}  ${netP > 0 ? '<-- POSITIVE ✓' : '<-- still negative'}`);
  console.log(`  Net Margin:    ${dbSales > 0 ? ((netP / dbSales) * 100).toFixed(1) : '0'}%`);
  console.log(`  Total Sales Count: ${totalSaleCount}`);
  console.log('═══════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('FAILED:', err.message || err);
  mongoose.disconnect().finally(() => process.exit(1));
});
