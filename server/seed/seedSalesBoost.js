/**
 * seed/seedSalesBoost.js
 *
 * Idempotent sales-boost seed for Prime Mart demo account.
 * Adds BOOST-001...BOOST-025 across Oct 1-16, 2026.
 * Usage (from server/ directory):
 *   node seed/seedSalesBoost.js
 */
'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const User    = require('../models/User');
const Product = require('../models/Product');
const Sale    = require('../models/Sale');

const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@primemart.live';
const MONGO_URI  = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartbiz';

const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

const oct = (day, hh = 10, mm = 0) => {
  const iso = `2026-10-${String(day).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+05:30`;
  return new Date(iso);
};

const run = async () => {
  console.log('\n Connecting to MongoDB ...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected');

  const user = await User.findOne({ email: DEMO_EMAIL.toLowerCase() });
  if (!user) {
    console.error('Demo user not found. Run seedDemo.js first.');
    process.exit(1);
  }
  const userId = user._id;

  const allProducts = await Product.find({ userId });
  if (allProducts.length === 0) {
    console.error('No products found. Run seedDemo.js first.');
    process.exit(1);
  }

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

  const boostSales = [
    { inv:'BOOST-001', date:oct(1,9,30),  customer:'Suresh Nair',          pay:'Cash', discount:0,   items:[line('DEMO-RICE-5KG',4), line('DEMO-OIL-1L',3),          line('DEMO-SUGAR-1KG',5)]     },
    { inv:'BOOST-002', date:oct(1,15,10), customer:'Walk-in Customer',      pay:'UPI',  discount:0,   items:[line('DEMO-BISCUITS',6),  line('DEMO-NOODLES-4PK',4),     line('DEMO-WATER-1L',10)]     },
    { inv:'BOOST-003', date:oct(2,10,0),  customer:'Kavitha Reddy',         pay:'Card', discount:50,  items:[line('DEMO-ATTA-5KG',3),  line('DEMO-WHEAT-2KG',2),       line('DEMO-TOOR-DAL',3)]      },
    { inv:'BOOST-004', date:oct(2,17,30), customer:'Walk-in Customer',      pay:'Cash', discount:0,   items:[line('DEMO-CHIPS-50G',8), line('DEMO-PEANUTS-200G',4),    line('DEMO-JUICE-1L',5)]      },
    { inv:'BOOST-005', date:oct(3,9,0),   customer:'Deepa Menon',           pay:'UPI',  discount:0,   items:[line('DEMO-RICE-5KG',5),  line('DEMO-SUN-OIL-1L',3),      line('DEMO-DETERGENT',2)]     },
    { inv:'BOOST-006', date:oct(3,14,15), customer:'Ravi Krishnan',         pay:'Cash', discount:30,  items:[line('DEMO-TEA-250G',3),  line('DEMO-GREEN-TEA-25B',2),   line('DEMO-SUGAR-1KG',4)]     },
    { inv:'BOOST-007', date:oct(4,11,45), customer:'Ananya Joshi',          pay:'Card', discount:0,   items:[line('DEMO-SHAMPOO-180ML',3), line('DEMO-TOOTHPASTE-150G',4), line('DEMO-DISHWASH-500M',2)] },
    { inv:'BOOST-008', date:oct(4,16,0),  customer:'Walk-in Customer',      pay:'UPI',  discount:0,   items:[line('DEMO-BASMATI-1KG',5), line('DEMO-CHANA-DAL-1KG',3), line('DEMO-KETCHUP-500G',2)]  },
    { inv:'BOOST-009', date:oct(5,9,30),  customer:'Mohan Pillai',          pay:'Cash', discount:0,   items:[line('DEMO-RICE-5KG',6),  line('DEMO-OIL-1L',4),          line('DEMO-WHEAT-2KG',3)]     },
    { inv:'BOOST-010', date:oct(5,17,0),  customer:'Walk-in Customer',      pay:'UPI',  discount:0,   items:[line('DEMO-NOODLES-4PK',6), line('DEMO-BISCUITS',8),       line('DEMO-WATER-1L',12)]     },
    { inv:'BOOST-011', date:oct(6,10,30), customer:'Sunita Verma',          pay:'Card', discount:100, items:[line('DEMO-ATTA-5KG',4),  line('DEMO-MUSTARD-OIL-1L',2),  line('DEMO-URAD-DAL-1KG',3)]  },
    { inv:'BOOST-012', date:oct(6,15,0),  customer:'Walk-in Customer',      pay:'Cash', discount:0,   items:[line('DEMO-BUTTER-100G',4), line('DEMO-PANEER-200G',3),    line('DEMO-JUICE-1L',4)]      },
    { inv:'BOOST-013', date:oct(7,9,0),   customer:'Arjun Mehta',           pay:'UPI',  discount:0,   items:[line('DEMO-RICE-5KG',8),  line('DEMO-SUGAR-1KG',8),       line('DEMO-TEA-250G',4)]      },
    { inv:'BOOST-014', date:oct(7,14,0),  customer:'Walk-in Customer',      pay:'Cash', discount:0,   items:[line('DEMO-FLOOR-CLEANER',2), line('DEMO-DISHWASH-500M',3), line('DEMO-DETERGENT',2)]    },
    { inv:'BOOST-015', date:oct(9,9,30),  customer:'Lakshmi Iyer',          pay:'Card', discount:0,   items:[line('DEMO-RICE-5KG',5),  line('DEMO-OIL-1L',5),          line('DEMO-TOOR-DAL',4)]      },
    { inv:'BOOST-016', date:oct(9,16,30), customer:'Walk-in Customer',      pay:'UPI',  discount:0,   items:[line('DEMO-CHIPS-50G',10), line('DEMO-NOODLES-4PK',5),    line('DEMO-PEANUTS-200G',5)]  },
    { inv:'BOOST-017', date:oct(11,10,0), customer:'Ramesh Babu',           pay:'Cash', discount:0,   items:[line('DEMO-ATTA-5KG',5),  line('DEMO-CHANA-DAL-1KG',4),  line('DEMO-SUN-OIL-1L',3)]    },
    { inv:'BOOST-018', date:oct(11,15,30),customer:'Walk-in Customer',      pay:'UPI',  discount:0,   items:[line('DEMO-SHAMPOO-180ML',4), line('DEMO-TOOTHPASTE-150G',5), line('DEMO-KETCHUP-500G',3)] },
    { inv:'BOOST-019', date:oct(12,9,0),  customer:'Nalini Krishnaswamy',   pay:'Card', discount:200, items:[line('DEMO-RICE-5KG',10), line('DEMO-SUGAR-1KG',10),      line('DEMO-OIL-1L',6)]        },
    { inv:'BOOST-020', date:oct(13,11,0), customer:'Venkatesh Rao',         pay:'Cash', discount:0,   items:[line('DEMO-BASMATI-1KG',6), line('DEMO-URAD-DAL-1KG',4), line('DEMO-MUSTARD-OIL-1L',3)] },
    { inv:'BOOST-021', date:oct(13,17,15),customer:'Walk-in Customer',      pay:'UPI',  discount:0,   items:[line('DEMO-BISCUITS',10), line('DEMO-JUICE-1L',6),        line('DEMO-WATER-1L',15)]     },
    { inv:'BOOST-022', date:oct(14,10,30),customer:'Girija Subramaniam',    pay:'Card', discount:0,   items:[line('DEMO-BUTTER-100G',5), line('DEMO-PANEER-200G',4),   line('DEMO-GREEN-TEA-25B',3)] },
    { inv:'BOOST-023', date:oct(15,9,30), customer:'Kiran Desai',           pay:'Cash', discount:0,   items:[line('DEMO-RICE-5KG',6),  line('DEMO-WHEAT-2KG',4),       line('DEMO-TOOR-DAL',5)]      },
    { inv:'BOOST-024', date:oct(16,11,0), customer:'Padma Rajan',           pay:'UPI',  discount:50,  items:[line('DEMO-DETERGENT',3),  line('DEMO-FLOOR-CLEANER',2),  line('DEMO-DISHWASH-500M',4)] },
    { inv:'BOOST-025', date:oct(16,17,45),customer:'Walk-in Customer',      pay:'Cash', discount:0,   items:[line('DEMO-CHIPS-50G',12), line('DEMO-NOODLES-4PK',8),    line('DEMO-PEANUTS-200G',6)]  }
  ];

  let inserted = 0, skipped = 0, totalRevenue = 0, totalCogs = 0;

  for (const s of boostSales) {
    const existing = await Sale.findOne({ userId, invoiceNumber: s.inv });
    if (existing) { skipped++; console.log(`  skip  ${s.inv}`); continue; }

    const subtotal    = round2(s.items.reduce((a, i) => a + i.subtotal, 0));
    const cogsAmount  = round2(s.items.reduce((a, i) => a + (i.totalCost || 0), 0));
    const totalAmount = round2(subtotal - (s.discount || 0));

    const maxSale = await Sale.findOne({ userId }).sort({ saleNumber: -1 });
    const nextNum = (maxSale?.saleNumber || 0) + 1;

    await Sale.create({
      userId,
      saleNumber      : nextNum,
      invoiceNumber   : s.inv,
      customerName    : s.customer,
      items           : s.items,
      subtotal,
      discount        : s.discount || 0,
      tax             : 0,
      totalAmount,
      costOfGoodsSold : cogsAmount,
      hasIncompleteCost: false,
      paymentMethod   : s.pay,
      date            : s.date,
      notes           : '[BOOST DATA] Monthly business activity'
    });

    totalRevenue += totalAmount;
    totalCogs    += cogsAmount;
    inserted++;
    console.log(`  + ${s.inv}  Rs.${totalAmount}  (COGS Rs.${cogsAmount})`);
  }

  const totalSaleCount = await Sale.countDocuments({ userId });
  await User.updateOne({ _id: userId }, { $set: { saleCounter: totalSaleCount } });

  console.log('\n--- Summary ---');
  console.log(`Inserted: ${inserted}   Skipped: ${skipped}`);
  console.log(`Boost Revenue:  Rs.${round2(totalRevenue)}`);
  console.log(`Boost COGS:     Rs.${round2(totalCogs)}`);
  console.log(`Boost Margin:   Rs.${round2(totalRevenue - totalCogs)}  (${round2(((totalRevenue - totalCogs)/totalRevenue)*100)}%)`);
  const existingOpEx = 18700;
  const existingSales = 4535;
  const grandSales = round2(totalRevenue + existingSales);
  const grandCogs  = round2(totalCogs);
  const grossP = round2(grandSales - grandCogs);
  const netP   = round2(grossP - existingOpEx);
  console.log(`\nEstimated dashboard:`);
  console.log(`  Total Sales:   Rs.${grandSales}`);
  console.log(`  COGS:          Rs.${grandCogs}`);
  console.log(`  Gross Profit:  Rs.${grossP}`);
  console.log(`  Net Profit:    Rs.${netP}  ${netP > 0 ? '<-- POSITIVE!' : '<-- still negative'}`);
  console.log(`  Sale counter:  ${totalSaleCount}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('FAILED:', err.message || err);
  mongoose.disconnect().finally(() => process.exit(1));
});
