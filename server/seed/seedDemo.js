/**
 * seed/seedDemo.js
 *
 * Safe, idempotent production seed script for Prime Mart.
 *
 * What it does
 * ─────────────
 *  1. Connects to whatever MONGODB_URI is set in the environment (or server/.env).
 *  2. Creates a dedicated demo user  (demo@primemart.live)  if one does not yet exist.
 *     — Existing users and their data are NEVER touched.
 *  3. Seeds products, sales, expenses, and staff under that demo user's userId.
 *  4. The seed is idempotent: running it again will not create duplicate records
 *     (it looks up existing records by a stable fingerprint field before inserting).
 *
 * What it does NOT do
 * ────────────────────
 *  ✗  Does NOT wipe any collection.
 *  ✗  Does NOT touch documents owned by any other userId.
 *  ✗  Does NOT commit any secrets to source control.
 *
 * Usage
 * ─────
 *   # From the server/ directory, with DEMO_PASSWORD set:
 *   DEMO_PASSWORD=YourPassword123 node seed/seedDemo.js
 *
 *   # Or point at Atlas explicitly:
 *   MONGODB_URI="mongodb+srv://..." DEMO_PASSWORD=YourPassword123 node seed/seedDemo.js
 *
 * Environment variables
 * ─────────────────────
 *   MONGODB_URI   — MongoDB connection string (defaults to localhost:27017/smartbiz)
 *   DEMO_EMAIL    — Login email for the demo account (default: demo@primemart.live)
 *   DEMO_PASSWORD — (REQUIRED) Password for the demo account
 */

'use strict';

require('dotenv').config(); // loads server/.env when run from the server/ directory

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Product  = require('../models/Product');
const Sale     = require('../models/Sale');
const Expense  = require('../models/Expense');
const Staff    = require('../models/Staff');

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_EMAIL    = process.env.DEMO_EMAIL    || 'demo@primemart.live';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
const MONGO_URI     = process.env.MONGODB_URI   || 'mongodb://localhost:27017/smartbiz';

// All demo dates are fixed to 17 October 2026 (IST = UTC+5:30)
// We store them as UTC. 17-Oct-2026 00:00 IST  =  16-Oct-2026 18:30 UTC
const oct17 = (hh = 10, mm = 0) => {
  // hh and mm are in IST for readability; we subtract 5h30m to get UTC
  const d = new Date('2026-10-17T00:00:00+05:30');
  d.setHours(d.getHours() + hh);
  d.setMinutes(d.getMinutes() + mm);
  return d;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

/** Return an existing doc or null — never throws on missing */
const findOneBySku  = (userId, sku)  => Product.findOne({ userId, sku });
const findOneByInv  = (userId, inv)  => Sale.findOne({ userId, invoiceNumber: inv });
const findOneByDesc = (userId, desc, date) =>
  Expense.findOne({ userId, description: desc, date: { $gte: new Date(date.setHours(0,0,0,0)), $lte: new Date(date.setHours(23,59,59,999)) } });
const findStaffByEmail = (userId, email) => Staff.findOne({ userId, email });

// ─────────────────────────────────────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────────────────────────────────────

const run = async () => {
  if (!DEMO_PASSWORD) {
    console.error('\n❌ DEMO_PASSWORD is required.\n');
    console.error('   Usage:  DEMO_PASSWORD=YourPassword123 node seed/seedDemo.js\n');
    process.exit(1);
  }

  // ── Connect ──────────────────────────────────────────────────────────────
  console.log('\n🔗 Connecting to MongoDB …');
  await mongoose.connect(MONGO_URI);
  console.log(`✓ Connected  →  ${MONGO_URI.replace(/\/\/[^@]+@/, '//<credentials>@')}`);

  // ── Demo user (idempotent) ───────────────────────────────────────────────
  let user = await User.findOne({ email: DEMO_EMAIL.toLowerCase() });

  if (user) {
    console.log(`✓ Demo user already exists  (${DEMO_EMAIL})  — skipping user creation`);
  } else {
    user = new User({
      businessName : 'Prime Mart Demo',
      ownerName    : 'Harikrishnan',
      email        : DEMO_EMAIL,
      phone        : '+91 9000000001',
      password     : DEMO_PASSWORD,   // hashed by the pre-save hook in User.js
      saleCounter  : 0
    });
    await user.save();
    console.log(`✓ Demo user created  →  email: ${DEMO_EMAIL}`);
  }

  const userId = user._id;

  // ── Products (8 items, idempotent by SKU) ────────────────────────────────
  // NOTE: stock quantities here are the REMAINING stock AFTER the 5 demo sales
  // below have already been subtracted, so the inventory figures are consistent
  // with the sale records without needing to touch Product.stock at runtime.
  //
  // Format: [name, sku, category, purchasePrice, sellingPrice, stock, minimumStock, supplier]
  const productCatalog = [
    //  name                   sku                  category        buy    sell  qty  min  supplier
    ['Rice 5kg',             'DEMO-RICE-5KG',     'Groceries',    400,   500,   43,  10, 'Wholesale Mart'],
    ['Wheat Flour 2kg',      'DEMO-WHEAT-2KG',    'Groceries',    150,   200,   29,   8, 'Flour Mills'],
    ['Cooking Oil 1L',       'DEMO-OIL-1L',       'Cooking Items',120,   180,   37,   8, 'Oil Distributor'],
    ['Sugar 1kg',            'DEMO-SUGAR-1KG',    'Groceries',     50,    70,   53,  15, 'Sugar Factory'],
    ['Tea Leaves 250g',      'DEMO-TEA-250G',     'Beverages',    200,   300,   30,  10, 'Tea Estate'],
    ['Toor Dal 1kg',         'DEMO-TOOR-DAL',     'Pulses',       110,   150,   20,   7, 'Pulse Traders'],
    ['Biscuits 200g',        'DEMO-BISCUITS',     'Snacks',        22,    35,   50,  12, 'Fresh Bakes'],
    ['Detergent 1kg',        'DEMO-DETERGENT',    'Household',    105,   145,   14,   5, 'CleanHome Distributors'],
    ['Basmati Rice 1kg',     'DEMO-BASMATI-1KG',  'Groceries',     95,   135,   35,   8, 'Himalayan Grains Co.'],
    ['Atta (Whole Wheat) 5kg','DEMO-ATTA-5KG',    'Groceries',    210,   260,   28,   6, 'Aashirvaad Distributors'],
    ['Refined Sunflower Oil 1L','DEMO-SUN-OIL-1L','Cooking Items',115,   145,   40,  10, 'Fortune Foods'],
    ['Mustard Oil 1L',       'DEMO-MUSTARD-OIL-1L','Cooking Items',130,  165,   25,   5, 'Kachi Ghani Mills'],
    ['Chana Dal 1kg',        'DEMO-CHANA-DAL-1KG','Pulses',        78,    98,   30,   8, 'Pulse Traders'],
    ['Urad Dal (Split) 1kg', 'DEMO-URAD-DAL-1KG', 'Pulses',       115,   140,   22,   5, 'Pulse Traders'],
    ['Green Tea 25 Bags',    'DEMO-GREEN-TEA-25B','Beverages',    140,   190,   24,   5, 'Organic India Traders'],
    ['Fruit Juice 1L',       'DEMO-JUICE-1L',     'Beverages',     85,   120,   32,   8, 'Real Beverages Ltd'],
    ['Mineral Water 1L',     'DEMO-WATER-1L',     'Beverages',     12,    20,   60,  15, 'Bisleri Aqua Supply'],
    ['Instant Noodles 4-Pack','DEMO-NOODLES-4PK', 'Snacks',        48,    60,   45,  10, 'Nestle Distribution'],
    ['Potato Chips 50g',     'DEMO-CHIPS-50G',    'Snacks',        15,    20,   50,  12, 'Frito-Lay India'],
    ['Roasted Peanuts 200g', 'DEMO-PEANUTS-200G', 'Snacks',        45,    65,   30,   8, 'Haldiram Snacks'],
    ['Tomato Ketchup 500g',  'DEMO-KETCHUP-500G', 'Groceries',     85,   115,   25,   5, 'Kissan Foods'],
    ['Butter 100g',          'DEMO-BUTTER-100G',  'Dairy',         46,    58,   26,   6, 'Amul Dairy Depot'],
    ['Paneer 200g',          'DEMO-PANEER-200G',  'Dairy',         72,    90,   18,   5, 'Amul Dairy Depot'],
    ['Toothpaste 150g',      'DEMO-TOOTHPASTE-150G','Personal Care',75,  105,   35,   8, 'Colgate Consumer Care'],
    ['Hair Shampoo 180ml',   'DEMO-SHAMPOO-180ML','Personal Care',110,   150,   20,   5, 'Personal Care Wholesale'],
    ['Dishwash Liquid 500ml','DEMO-DISHWASH-500M','Household',     82,   110,   30,   8, 'CleanHome Distributors'],
    ['Floor Cleaner 1L',     'DEMO-FLOOR-CLEANER','Household',     95,   135,   22,   5, 'CleanHome Distributors'],
  ];

  const productMap = {}; // sku → saved Product document

  for (const [name, sku, category, purchasePrice, sellingPrice, stock, minimumStock, supplier] of productCatalog) {
    let prod = await findOneBySku(userId, sku);
    if (prod) {
      console.log(`  ↷ Product exists  →  ${name} (${sku})`);
    } else {
      prod = await Product.create({ userId, name, sku, category, purchasePrice, sellingPrice, stock, minimumStock, supplier });
      console.log(`  + Product created  →  ${name}`);
    }
    productMap[sku] = prod;
  }
  console.log('✓ Products done');

  // ── Sales (5 bills on 17-Oct-2026, idempotent by invoiceNumber) ──────────
  // Helper: build a sale line from SKU + quantity (prices come from saved Product)
  const line = (sku, qty) => {
    const p = productMap[sku];
    if (!p) throw new Error(`Unknown SKU in sales data: ${sku}`);
    return {
      productId  : p._id,
      productName: p.name,
      quantity   : qty,
      unitPrice  : p.sellingPrice,
      subtotal   : round2(qty * p.sellingPrice)
    };
  };

  // Consistent revenue figures:
  //  Sale DEMO-001: Rice 5kg×2 + Cooking Oil 1L×3 = 1000 + 540 = 1540  cash
  //  Sale DEMO-002: Wheat Flour 2kg×1 + Tea Leaves 250g×2 = 200 + 600 = 800  upi  discount 20
  //  Sale DEMO-003: Sugar 1kg×5 + Biscuits 200g×4 = 350 + 140 = 490  cash
  //  Sale DEMO-004: Toor Dal 1kg×2 + Detergent 1kg×1 = 300 + 145 = 445  card  tax 22
  //  Sale DEMO-005: Rice 5kg×1 + Wheat Flour 2kg×2 + Cooking Oil 1L×2 = 500 + 400 + 360 = 1260  upi

  const demoSales = [
    {
      invoiceNumber: 'DEMO-001',
      saleNumber   : 1,
      customerName : 'Rajesh Kumar',
      paymentMethod: 'Cash',
      date         : oct17(10, 15),
      discount     : 0,
      tax          : 0,
      notes        : '[DEMO DATA] Opening sale of the day',
      items        : [line('DEMO-RICE-5KG', 2), line('DEMO-OIL-1L', 3)]
    },
    {
      invoiceNumber: 'DEMO-002',
      saleNumber   : 2,
      customerName : 'Priya Sharma',
      paymentMethod: 'UPI',
      date         : oct17(11, 30),
      discount     : 20,
      tax          : 0,
      notes        : '[DEMO DATA] Regular customer discount',
      items        : [line('DEMO-WHEAT-2KG', 1), line('DEMO-TEA-250G', 2)]
    },
    {
      invoiceNumber: 'DEMO-003',
      saleNumber   : 3,
      customerName : 'Walk-in Customer',
      paymentMethod: 'Cash',
      date         : oct17(13, 0),
      discount     : 0,
      tax          : 0,
      notes        : '[DEMO DATA]',
      items        : [line('DEMO-SUGAR-1KG', 5), line('DEMO-BISCUITS', 4)]
    },
    {
      invoiceNumber: 'DEMO-004',
      saleNumber   : 4,
      customerName : 'Amit Singh',
      paymentMethod: 'Card',
      date         : oct17(15, 20),
      discount     : 0,
      tax          : 22,
      notes        : '[DEMO DATA] Corporate purchase',
      items        : [line('DEMO-TOOR-DAL', 2), line('DEMO-DETERGENT', 1)]
    },
    {
      invoiceNumber: 'DEMO-005',
      saleNumber   : 5,
      customerName : 'Meena Iyer',
      paymentMethod: 'UPI',
      date         : oct17(17, 45),
      discount     : 0,
      tax          : 0,
      notes        : '[DEMO DATA] Evening bulk purchase',
      items        : [line('DEMO-RICE-5KG', 1), line('DEMO-WHEAT-2KG', 2), line('DEMO-OIL-1L', 2)]
    }
  ];

  let salesInserted = 0;
  for (const s of demoSales) {
    const existing = await findOneByInv(userId, s.invoiceNumber);
    if (existing) {
      console.log(`  ↷ Sale exists  →  ${s.invoiceNumber}`);
      continue;
    }
    const subtotal = round2(s.items.reduce((sum, i) => sum + i.subtotal, 0));
    const totalAmount = round2(subtotal - s.discount + s.tax);
    await Sale.create({
      userId,
      saleNumber   : s.saleNumber,
      invoiceNumber: s.invoiceNumber,
      customerName : s.customerName,
      items        : s.items,
      subtotal,
      discount     : s.discount,
      tax          : s.tax,
      totalAmount,
      paymentMethod: s.paymentMethod,
      date         : s.date,
      notes        : s.notes
    });
    salesInserted++;
    console.log(`  + Sale created  →  ${s.invoiceNumber}  ₹${totalAmount}`);
  }

  // Keep saleCounter in sync with how many demo sales this user owns
  const totalSales = await Sale.countDocuments({ userId });
  await User.updateOne({ _id: userId }, { $set: { saleCounter: totalSales } });
  console.log(`✓ Sales done  (${salesInserted} new, saleCounter = ${totalSales})`);

  // ── Expenses (4 records on 17-Oct-2026, idempotent by description+date) ──
  //  Total expenses on 17-Oct-2026 = 5000 + 15000 + 2500 + 1200 = 23700
  const demoExpenses = [
    {
      category     : 'Stock Purchase',
      amount       : 5000,
      description  : '[DEMO] Rice & flour restock — 17 Oct 2026',
      paymentMethod: 'Card',
      date         : oct17(9, 0),
      notes        : 'DEMO DATA'
    },
    {
      category     : 'Shop Rent',
      amount       : 15000,
      description  : '[DEMO] Monthly rent payment — Oct 2026',
      paymentMethod: 'Cash',
      date         : oct17(9, 30),
      notes        : 'DEMO DATA'
    },
    {
      category     : 'Electricity',
      amount       : 2500,
      description  : '[DEMO] Electricity bill — Oct 2026',
      paymentMethod: 'UPI',
      date         : oct17(10, 0),
      notes        : 'DEMO DATA'
    },
    {
      category     : 'Maintenance',
      amount       : 1200,
      description  : '[DEMO] Shop cleaning & maintenance — 17 Oct 2026',
      paymentMethod: 'Cash',
      date         : oct17(11, 0),
      notes        : 'DEMO DATA'
    }
  ];

  let expensesInserted = 0;
  for (const e of demoExpenses) {
    const dateCopy = new Date(e.date);
    const existing = await Expense.findOne({
      userId,
      description: e.description,
      date: {
        $gte: new Date(new Date(dateCopy).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(dateCopy).setHours(23, 59, 59, 999))
      }
    });
    if (existing) {
      console.log(`  ↷ Expense exists  →  ${e.description}`);
      continue;
    }
    await Expense.create({ userId, ...e });
    expensesInserted++;
    console.log(`  + Expense created  →  ${e.category}  ₹${e.amount}`);
  }
  console.log(`✓ Expenses done  (${expensesInserted} new)`);

  // ── Staff (5 records, idempotent by email) ───────────────────────────────
  const demoStaff = [
    {
      name       : 'Rohan Patel',
      phone      : '+91 9811000001',
      email      : 'rohan.patel@demo.primemart.live',
      role       : 'Manager',
      salary     : 28000,
      joiningDate: new Date('2026-10-17T00:00:00+05:30'),
      status     : 'Active'
    },
    {
      name       : 'Priya Singh',
      phone      : '+91 9811000002',
      email      : 'priya.singh@demo.primemart.live',
      role       : 'Cashier',
      salary     : 16000,
      joiningDate: new Date('2026-10-17T00:00:00+05:30'),
      status     : 'Active'
    },
    {
      name       : 'Vikram Kumar',
      phone      : '+91 9811000003',
      email      : 'vikram.kumar@demo.primemart.live',
      role       : 'Sales Staff',
      salary     : 13000,
      joiningDate: new Date('2026-10-17T00:00:00+05:30'),
      status     : 'Active'
    },
    {
      name       : 'Anjali Sharma',
      phone      : '+91 9811000004',
      email      : 'anjali.sharma@demo.primemart.live',
      role       : 'Delivery Staff',
      salary     : 11000,
      joiningDate: new Date('2026-10-17T00:00:00+05:30'),
      status     : 'Active'
    },
    {
      name       : 'Suresh Nair',
      phone      : '+91 9811000005',
      email      : 'suresh.nair@demo.primemart.live',
      role       : 'Other',
      salary     : 9500,
      joiningDate: new Date('2026-10-17T00:00:00+05:30'),
      status     : 'Active'
    }
  ];

  let staffInserted = 0;
  for (const s of demoStaff) {
    const existing = await findStaffByEmail(userId, s.email);
    if (existing) {
      console.log(`  ↷ Staff exists  →  ${s.name}`);
      continue;
    }
    await Staff.create({ userId, ...s });
    staffInserted++;
    console.log(`  + Staff created  →  ${s.name}  (${s.role})`);
  }
  console.log(`✓ Staff done  (${staffInserted} new)`);

  // ── Summary ──────────────────────────────────────────────────────────────
  const [pCount, sCount, eCount, stCount] = await Promise.all([
    Product.countDocuments({ userId }),
    Sale.countDocuments({ userId }),
    Expense.countDocuments({ userId }),
    Staff.countDocuments({ userId })
  ]);

  const totalRevenue = demoSales.reduce((sum, s) => {
    const sub = round2(s.items.reduce((t, i) => t + i.subtotal, 0));
    return sum + round2(sub - s.discount + s.tax);
  }, 0);
  const totalExpenses = demoExpenses.reduce((sum, e) => sum + e.amount, 0);

  console.log('\n' + '─'.repeat(56));
  console.log('✅  Demo seed complete');
  console.log('─'.repeat(56));
  console.log(`   Demo account   →  ${DEMO_EMAIL}`);
  console.log(`   Password       →  supplied via DEMO_PASSWORD`);
  console.log(`   Products       →  ${pCount} in inventory`);
  console.log(`   Sales (17 Oct) →  ${sCount} bills   ₹${totalRevenue} revenue`);
  console.log(`   Expenses       →  ${eCount} records  ₹${totalExpenses} total`);
  console.log(`   Staff          →  ${stCount} members`);
  console.log('─'.repeat(56));
  console.log('\n📊 Expected dashboard figures for 17 October 2026:');

  // Print per-sale breakdown
  let n = 1;
  for (const s of demoSales) {
    const sub = round2(s.items.reduce((t, i) => t + i.subtotal, 0));
    const total = round2(sub - s.discount + s.tax);
    console.log(`   ${s.invoiceNumber}  ${s.customerName.padEnd(18)}  ₹${total}  (${s.paymentMethod})`);
    n++;
  }

  console.log(`\n   Total revenue  →  ₹${totalRevenue}`);
  console.log(`   Total expenses →  ₹${totalExpenses}`);
  console.log(`   Gross profit   →  ₹${totalRevenue - totalExpenses}`);
  console.log('\n🌐 Live site: https://harikrishnan200612.github.io/Prime-Mart-/\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('\n❌ Seed script failed:', err.message || err);
  mongoose.disconnect().finally(() => process.exit(1));
});
