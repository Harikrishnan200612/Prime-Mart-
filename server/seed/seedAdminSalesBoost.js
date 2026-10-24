/**
 * seed/seedAdminSalesBoost.js
 *
 * Idempotent sales-boost seed for admin@primemart.com.
 * Adds realistic daily sales across October 2026 to achieve positive net profit.
 * Usage (from server/ directory):
 *   node seed/seedAdminSalesBoost.js
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

// Build a date in IST for October 2026
const oct = (day, hh = 10, mm = 0) => {
  const iso = `2026-10-${String(day).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+05:30`;
  return new Date(iso);
};

const run = async () => {
  console.log('\nConnecting to MongoDB …');
  await mongoose.connect(MONGO_URI);
  console.log('Connected\n');

  const user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (!user) {
    console.error('Admin user not found.');
    process.exit(1);
  }
  const userId = user._id;

  const allProducts = await Product.find({ userId });
  if (allProducts.length === 0) {
    console.error('No products found.');
    process.exit(1);
  }

  // Build SKU lookup
  const bySku = {};
  for (const p of allProducts) bySku[p.sku] = p;

  // Helper: build a sale line item from sku + qty
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

  // ─────────────────────────────────────────────────────────────────────────
  // 60 realistic sales across Oct 1-24, 2026
  // Customers are a mix of regular shoppers and walk-ins
  // Payment: ~60% Cash, ~25% UPI, ~15% Card
  // ─────────────────────────────────────────────────────────────────────────
  const boostSales = [
    // Oct 1
    { inv:'ADM-B001', date:oct(1,9,15),  customer:'Suresh Nair',       pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',3), line('OIL-1L-001',2), line('SUGAR-1KG-001',4)] },
    { inv:'ADM-B002', date:oct(1,11,30), customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('NOODLES-4PK-001',5), line('BISCUIT-200G-001',8), line('WATER-1L-001',12)] },
    { inv:'ADM-B003', date:oct(1,16,0),  customer:'Kavitha Reddy',     pay:'Cash', discount:0,
      items:[line('ATTA-5KG-001',2), line('MOONG-DAL-1KG-001',2), line('TOOR-DAL-1KG-001',2)] },

    // Oct 2
    { inv:'ADM-B004', date:oct(2,9,45),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',4), line('WHEAT-2KG-001',2), line('SALT-1KG-001',3)] },
    { inv:'ADM-B005', date:oct(2,14,0),  customer:'Deepa Menon',       pay:'UPI',  discount:0,
      items:[line('CHIPS-50G-001',6), line('PEANUTS-200G-001',4), line('JUICE-1L-001',4)] },
    { inv:'ADM-B006', date:oct(2,17,30), customer:'Ravi Krishnan',     pay:'Card', discount:50,
      items:[line('SHAMPOO-180ML-001',2), line('TOOTHPASTE-150G-001',3), line('SOAP-100G-001',4)] },

    // Oct 3
    { inv:'ADM-B007', date:oct(3,10,0),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('OIL-5L-001',2), line('RICE-10KG-001',1), line('SUGAR-1KG-001',5)] },
    { inv:'ADM-B008', date:oct(3,12,30), customer:'Ananya Joshi',      pay:'UPI',  discount:0,
      items:[line('BUTTER-100G-001',3), line('PANEER-200G-001',2), line('MILK-1L-001',2)] },
    { inv:'ADM-B009', date:oct(3,16,45), customer:'Mohan Pillai',      pay:'Cash', discount:0,
      items:[line('DETERGENT-1KG-001',2), line('DISHWASH-500ML-001',3), line('FLOOR-CLEANER-1L-001',2)] },

    // Oct 4
    { inv:'ADM-B010', date:oct(4,9,30),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',5), line('OIL-1L-001',3), line('TOOR-DAL-1KG-001',3)] },
    { inv:'ADM-B011', date:oct(4,14,15), customer:'Sunita Verma',      pay:'Card', discount:100,
      items:[line('ATTA-5KG-001',3), line('MUSTARD-OIL-1L-001',2), line('CHANA-DAL-1KG-001',3)] },
    { inv:'ADM-B012', date:oct(4,17,0),  customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('GREEN-TEA-25B-001',2), line('COFFEE-200G-001',1), line('BISCUIT-200G-001',6)] },

    // Oct 5
    { inv:'ADM-B013', date:oct(5,10,0),  customer:'Arjun Mehta',       pay:'Cash', discount:0,
      items:[line('RICE-10KG-001',2), line('SUN-OIL-1L-001',3), line('SUGAR-1KG-001',6)] },
    { inv:'ADM-B014', date:oct(5,15,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('CHIPS-50G-001',8), line('NOODLES-4PK-001',4), line('PEANUTS-200G-001',5)] },
    { inv:'ADM-B015', date:oct(5,17,45), customer:'Lakshmi Iyer',      pay:'UPI',  discount:0,
      items:[line('SHAMPOO-180ML-001',2), line('SOAP-100G-001',3), line('TOOTHPASTE-150G-001',2)] },

    // Oct 6
    { inv:'ADM-B016', date:oct(6,9,0),   customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',4), line('WHEAT-2KG-001',3), line('SALT-1KG-001',4)] },
    { inv:'ADM-B017', date:oct(6,12,30), customer:'Ramesh Babu',       pay:'Cash', discount:0,
      items:[line('OIL-5L-001',1), line('MUSTARD-OIL-1L-001',2), line('KETCHUP-500G-001',3)] },
    { inv:'ADM-B018', date:oct(6,17,0),  customer:'Girija Subramaniam',pay:'Card', discount:0,
      items:[line('BUTTER-100G-001',4), line('PANEER-200G-001',3), line('JUICE-1L-001',5)] },

    // Oct 7
    { inv:'ADM-B019', date:oct(7,9,30),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',3), line('TOOR-DAL-1KG-001',2), line('SUGAR-1KG-001',4)] },
    { inv:'ADM-B020', date:oct(7,11,0),  customer:'Kiran Desai',       pay:'UPI',  discount:50,
      items:[line('ATTA-5KG-001',2), line('CHANA-DAL-1KG-001',2), line('URAD-DAL-1KG-001',2)] },
    { inv:'ADM-B021', date:oct(7,16,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('BISCUIT-200G-001',10), line('WATER-1L-001',15), line('NOODLES-4PK-001',5)] },

    // Oct 8
    { inv:'ADM-B022', date:oct(8,10,15), customer:'Padma Rajan',       pay:'Card', discount:0,
      items:[line('RICE-10KG-001',2), line('OIL-1L-001',4), line('SALT-1KG-001',5)] },
    { inv:'ADM-B023', date:oct(8,14,0),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('DETERGENT-1KG-001',2), line('DISHWASH-500ML-001',2), line('SOAP-100G-001',5)] },
    { inv:'ADM-B024', date:oct(8,17,30), customer:'Nalini Krishnaswamy',pay:'UPI', discount:0,
      items:[line('GREEN-TEA-25B-001',3), line('COFFEE-200G-001',1), line('JUICE-1L-001',4)] },

    // Oct 9
    { inv:'ADM-B025', date:oct(9,9,0),   customer:'Venkatesh Rao',     pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',5), line('WHEAT-2KG-001',3), line('OIL-1L-001',3)] },
    { inv:'ADM-B026', date:oct(9,13,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('CHIPS-50G-001',10), line('PEANUTS-200G-001',5), line('BISCUIT-200G-001',8)] },
    { inv:'ADM-B027', date:oct(9,17,0),  customer:'Meena Sharma',      pay:'UPI',  discount:0,
      items:[line('SHAMPOO-180ML-001',2), line('TOOTHPASTE-150G-001',3), line('FLOOR-CLEANER-1L-001',2)] },

    // Oct 10
    { inv:'ADM-B028', date:oct(10,10,0), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('OIL-5L-001',2), line('SUGAR-1KG-001',8), line('TOOR-DAL-1KG-001',3)] },
    { inv:'ADM-B029', date:oct(10,14,30),customer:'Praveen Kumar',     pay:'Card', discount:100,
      items:[line('ATTA-5KG-001',3), line('SUN-OIL-1L-001',3), line('MOONG-DAL-1KG-001',2)] },
    { inv:'ADM-B030', date:oct(10,17,45),customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('BUTTER-100G-001',3), line('MILK-500ML-002',5), line('JUICE-1L-001',4)] },

    // Oct 11
    { inv:'ADM-B031', date:oct(11,9,15), customer:'Rekha Pillai',      pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',4), line('WHEAT-2KG-001',2), line('SALT-1KG-001',4)] },
    { inv:'ADM-B032', date:oct(11,12,0), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('KETCHUP-500G-001',3), line('NOODLES-4PK-001',6), line('BISCUIT-200G-001',8)] },
    { inv:'ADM-B033', date:oct(11,16,30),customer:'Sanjay Patel',      pay:'UPI',  discount:50,
      items:[line('DETERGENT-1KG-001',2), line('DISHWASH-500ML-001',3), line('SOAP-100G-001',4)] },

    // Oct 12
    { inv:'ADM-B034', date:oct(12,10,0), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-10KG-001',2), line('MUSTARD-OIL-1L-001',2), line('CHANA-DAL-1KG-001',3)] },
    { inv:'ADM-B035', date:oct(12,14,30),customer:'Priya Suresh',      pay:'Card', discount:0,
      items:[line('SHAMPOO-180ML-001',3), line('TOOTHPASTE-150G-001',3), line('GREEN-TEA-25B-001',2)] },
    { inv:'ADM-B036', date:oct(12,17,15),customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('CHIPS-50G-001',8), line('PEANUTS-200G-001',4), line('WATER-1L-001',15)] },

    // Oct 13
    { inv:'ADM-B037', date:oct(13,9,30), customer:'Harish Menon',      pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',3), line('OIL-1L-001',2), line('SUGAR-1KG-001',5)] },
    { inv:'ADM-B038', date:oct(13,11,30),customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('OIL-5L-001',1), line('ATTA-5KG-001',2), line('TOOR-DAL-1KG-001',2)] },
    { inv:'ADM-B039', date:oct(13,16,45),customer:'Divya Nair',        pay:'Cash', discount:0,
      items:[line('BUTTER-100G-001',4), line('PANEER-200G-001',3), line('JUICE-1L-001',5)] },

    // Oct 14
    { inv:'ADM-B040', date:oct(14,9,0),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',4), line('WHEAT-2KG-001',3), line('SALT-1KG-001',3)] },
    { inv:'ADM-B041', date:oct(14,13,0), customer:'Suresh Pillai',     pay:'UPI',  discount:0,
      items:[line('SUN-OIL-1L-001',3), line('URAD-DAL-1KG-001',2), line('MOONG-DAL-1KG-001',2)] },
    { inv:'ADM-B042', date:oct(14,17,30),customer:'Walk-in Customer',  pay:'Card', discount:75,
      items:[line('BISCUIT-200G-001',10), line('NOODLES-4PK-001',5), line('COFFEE-200G-001',1)] },

    // Oct 15
    { inv:'ADM-B043', date:oct(15,9,30), customer:'Anitha Krishnan',   pay:'Cash', discount:0,
      items:[line('RICE-10KG-001',2), line('OIL-1L-001',3), line('SUGAR-1KG-001',6)] },
    { inv:'ADM-B044', date:oct(15,12,30),customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('CHIPS-50G-001',8), line('PEANUTS-200G-001',5), line('KETCHUP-500G-001',3)] },
    { inv:'ADM-B045', date:oct(15,17,0), customer:'Rajkumar Verma',    pay:'UPI',  discount:0,
      items:[line('SHAMPOO-180ML-001',2), line('SOAP-100G-001',4), line('TOOTHPASTE-150G-001',3)] },

    // Oct 16
    { inv:'ADM-B046', date:oct(16,9,0),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',4), line('ATTA-5KG-001',2), line('TOOR-DAL-1KG-001',3)] },
    { inv:'ADM-B047', date:oct(16,11,30),customer:'Lalitha Devi',      pay:'Cash', discount:0,
      items:[line('MUSTARD-OIL-1L-001',2), line('SUN-OIL-1L-001',2), line('SALT-1KG-001',5)] },
    { inv:'ADM-B048', date:oct(16,15,0), customer:'Walk-in Customer',  pay:'UPI',  discount:100,
      items:[line('BUTTER-100G-001',3), line('PANEER-200G-001',2), line('JUICE-1L-001',4)] },
    { inv:'ADM-B049', date:oct(16,17,45),customer:'Suresh Nair',       pay:'Cash', discount:0,
      items:[line('DETERGENT-1KG-001',2), line('DISHWASH-500ML-001',2), line('FLOOR-CLEANER-1L-001',1)] },

    // Oct 17
    { inv:'ADM-B050', date:oct(17,10,0), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',3), line('OIL-1L-001',2), line('SUGAR-1KG-001',4)] },
    { inv:'ADM-B051', date:oct(17,14,30),customer:'Pooja Reddy',       pay:'UPI',  discount:0,
      items:[line('NOODLES-4PK-001',5), line('BISCUIT-200G-001',8), line('WATER-1L-001',10)] },

    // Oct 18
    { inv:'ADM-B052', date:oct(18,9,30), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-10KG-001',2), line('CHANA-DAL-1KG-001',3), line('WHEAT-2KG-001',3)] },
    { inv:'ADM-B053', date:oct(18,15,0), customer:'Bharati Iyer',      pay:'Card', discount:0,
      items:[line('GREEN-TEA-25B-001',2), line('COFFEE-200G-001',1), line('JUICE-1L-001',4)] },

    // Oct 19
    { inv:'ADM-B054', date:oct(19,10,15),customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('OIL-5L-001',2), line('SUGAR-1KG-001',6), line('SALT-1KG-001',4)] },
    { inv:'ADM-B055', date:oct(19,16,0), customer:'Suresh Kumar',      pay:'UPI',  discount:50,
      items:[line('CHIPS-50G-001',10), line('PEANUTS-200G-001',5), line('NOODLES-4PK-001',4)] },

    // Oct 20
    { inv:'ADM-B056', date:oct(20,9,0),  customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-5KG-001',4), line('OIL-1L-001',3), line('TOOR-DAL-1KG-001',3)] },
    { inv:'ADM-B057', date:oct(20,14,30),customer:'Rekha Sharma',      pay:'Cash', discount:0,
      items:[line('ATTA-5KG-001',2), line('MOONG-DAL-1KG-001',2), line('URAD-DAL-1KG-001',2)] },
    { inv:'ADM-B058', date:oct(20,17,0), customer:'Walk-in Customer',  pay:'UPI',  discount:0,
      items:[line('BUTTER-100G-001',3), line('MILK-500ML-002',4), line('KETCHUP-500G-001',2)] },

    // Oct 21
    { inv:'ADM-B059', date:oct(21,10,0), customer:'Walk-in Customer',  pay:'Cash', discount:0,
      items:[line('RICE-10KG-001',1), line('WHEAT-2KG-001',3), line('SUGAR-1KG-001',5)] },
    { inv:'ADM-B060', date:oct(21,15,30),customer:'Nandini Sharma',    pay:'Card', discount:100,
      items:[line('SHAMPOO-180ML-001',2), line('TOOTHPASTE-150G-001',4), line('SOAP-100G-001',5)] },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Insert idempotently: skip if invoiceNumber already exists for this user
  // ─────────────────────────────────────────────────────────────────────────
  let inserted = 0, skipped = 0, totalRevenue = 0, totalCogs = 0;

  for (const s of boostSales) {
    const existing = await Sale.findOne({ userId, invoiceNumber: s.inv });
    if (existing) { skipped++; process.stdout.write(`  skip  ${s.inv}\n`); continue; }

    // Check stock constraints — skip items with 0 stock, warn and reduce qty if needed
    const validItems = [];
    for (const item of s.items) {
      const prod = allProducts.find(p => p._id.toString() === item.productId.toString());
      if (!prod || prod.stock <= 0) {
        console.warn(`  WARN: ${item.productName} has no stock, skipping from ${s.inv}`);
        continue;
      }
      const qty = Math.min(item.quantity, prod.stock);
      if (qty < item.quantity) {
        console.warn(`  WARN: ${item.productName} stock ${prod.stock} < ${item.quantity}, capping to ${qty}`);
      }
      prod.stock -= qty; // track virtual stock deduction
      validItems.push({ ...item, quantity: qty, subtotal: round2(qty * item.unitPrice), totalCost: round2(qty * item.unitCost) });
    }

    if (validItems.length === 0) {
      console.warn(`  SKIP ${s.inv}: no valid items after stock check`);
      skipped++;
      continue;
    }

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
    process.stdout.write(`  + ${s.inv}  Rs.${totalAmount}  (COGS Rs.${cogsAmount}  margin Rs.${round2(totalAmount - cogsAmount)})\n`);
  }

  // Update saleCounter
  const totalSaleCount = await Sale.countDocuments({ userId });
  await User.updateOne({ _id: userId }, { $set: { saleCounter: totalSaleCount } });

  // Final financial summary
  const EXISTING_SALES   = 9616;
  const EXISTING_COGS    = 7322;
  const EXISTING_OP_EX   = 42300;

  const grandSales  = round2(totalRevenue + EXISTING_SALES);
  const grandCogs   = round2(totalCogs + EXISTING_COGS);
  const grossProfit = round2(grandSales - grandCogs);
  const netProfit   = round2(grossProfit - EXISTING_OP_EX);
  const netMargin   = grandSales > 0 ? ((netProfit / grandSales) * 100).toFixed(1) : '0';

  console.log('\n═══════════════════════════════════════');
  console.log('           BOOST COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`  Inserted:      ${inserted}`);
  console.log(`  Skipped:       ${skipped}`);
  console.log(`  Boost Revenue: Rs.${round2(totalRevenue)}`);
  console.log(`  Boost COGS:    Rs.${round2(totalCogs)}`);
  console.log(`  Boost Margin:  Rs.${round2(totalRevenue - totalCogs)}`);
  console.log('\n  Estimated Dashboard:');
  console.log(`  Total Sales:   Rs.${grandSales}`);
  console.log(`  Total COGS:    Rs.${grandCogs}`);
  console.log(`  Gross Profit:  Rs.${grossProfit}`);
  console.log(`  Op Expenses:   Rs.${EXISTING_OP_EX}`);
  console.log(`  Net Profit:    Rs.${netProfit}  ${netProfit > 0 ? '<-- POSITIVE ✓' : '<-- still negative'}`);
  console.log(`  Net Margin:    ${netMargin}%`);
  console.log(`  Sales count:   ${totalSaleCount}`);
  console.log('═══════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('FAILED:', err.message || err);
  mongoose.disconnect().finally(() => process.exit(1));
});
