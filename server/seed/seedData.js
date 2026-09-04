require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Staff = require('../models/Staff');

const seedData = async () => {
  try {
    const demoEmail = process.env.DEMO_EMAIL || 'admin@primemart.com';
    const demoPassword = process.env.DEMO_PASSWORD;
    if (!demoPassword) {
      throw new Error('DEMO_PASSWORD must be set before running the seed script');
    }

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartbiz');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Sale.deleteMany({});
    await Expense.deleteMany({});
    await Staff.deleteMany({});

    // Create demo user
    const user = new User({
      businessName: 'Prime Mart',
      ownerName: 'John Doe',
      email: demoEmail,
      phone: '+91 9876543210',
      password: demoPassword
    });
    await user.save();
    console.log('✓ Demo user created');

    const userId = user._id;

    // Create demo products
    const productCatalog = [
      ['Rice 5kg', 'RICE-5KG-001', 'Groceries', 400, 500, 45, 10, 'Wholesale Mart'],
      ['Rice 10kg', 'RICE-10KG-001', 'Groceries', 780, 950, 24, 6, 'Wholesale Mart'],
      ['Wheat Flour 2kg', 'WHEAT-2KG-001', 'Groceries', 150, 200, 30, 8, 'Flour Mills'],
      ['Sugar 1kg', 'SUGAR-1KG-001', 'Groceries', 50, 70, 60, 15, 'Sugar Factory'],
      ['Cooking Oil 1L', 'OIL-1L-001', 'Cooking Items', 120, 180, 40, 8, 'Oil Distributor'],
      ['Cooking Oil 5L', 'OIL-5L-001', 'Cooking Items', 590, 720, 18, 5, 'Oil Distributor'],
      ['Tea Leaves 250g', 'TEA-250G-001', 'Beverages', 200, 300, 6, 10, 'Tea Estate'],
      ['Coffee Powder 200g', 'COFFEE-200G-001', 'Beverages', 145, 220, 4, 8, 'South Coffee Co.'],
      ['Salt 1kg', 'SALT-1KG-001', 'Groceries', 18, 28, 36, 10, 'Coastal Foods'],
      ['Toor Dal 1kg', 'TOOR-DAL-1KG-001', 'Pulses', 110, 150, 22, 7, 'Pulse Traders'],
      ['Moong Dal 1kg', 'MOONG-DAL-1KG-001', 'Pulses', 105, 145, 16, 6, 'Pulse Traders'],
      ['Biscuits 200g', 'BISCUIT-200G-001', 'Snacks', 22, 35, 55, 12, 'Fresh Bakes'],
      ['Milk 1L', 'MILK-1L-001', 'Dairy', 48, 62, 0, 10, 'Local Dairy'],
      ['Detergent 1kg', 'DETERGENT-1KG-001', 'Household', 105, 145, 14, 5, 'CleanHome Distributors'],
      ['Soap 100g', 'SOAP-100G-001', 'Personal Care', 28, 42, 32, 8, 'Personal Care Wholesale']
    ];
    const products = productCatalog.map(([name, sku, category, purchasePrice, sellingPrice, stock, minimumStock, supplier]) => ({
      userId, name, sku, category, purchasePrice, sellingPrice, stock, minimumStock, supplier
    }));

    const savedProducts = await Product.insertMany(products);
    console.log('✓ Demo products created');

    // Create demo sales
    const sales = [
      {
        userId,
        productId: savedProducts[0]._id,
        productName: 'Rice 5kg',
        quantity: 2,
        sellingPrice: 500,
        totalAmount: 1000,
        paymentMethod: 'Cash',
        customerName: 'Rajesh Kumar',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        notes: 'Bulk purchase'
      },
      {
        userId,
        productId: savedProducts[1]._id,
        productName: 'Wheat Flour 2kg',
        quantity: 1,
        sellingPrice: 200,
        totalAmount: 200,
        paymentMethod: 'UPI',
        customerName: 'Priya Sharma',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        notes: ''
      },
      {
        userId,
        productId: savedProducts[2]._id,
        productName: 'Cooking Oil 1L',
        quantity: 3,
        sellingPrice: 180,
        totalAmount: 540,
        paymentMethod: 'Card',
        customerName: 'Walk-in Customer',
        date: new Date(),
        notes: ''
      },
      {
        userId,
        productId: savedProducts[0]._id,
        productName: 'Rice 5kg',
        quantity: 1,
        sellingPrice: 500,
        totalAmount: 500,
        paymentMethod: 'Cash',
        customerName: 'Amit Singh',
        date: new Date(),
        notes: ''
      },
      {
        userId,
        productId: savedProducts[3]._id,
        productName: 'Sugar 1kg',
        quantity: 5,
        sellingPrice: 70,
        totalAmount: 350,
        paymentMethod: 'UPI',
        customerName: 'Walk-in Customer',
        date: new Date(),
        notes: ''
      },
      {
        userId,
        productId: savedProducts[4]._id,
        productName: 'Tea Leaves 250g',
        quantity: 2,
        sellingPrice: 300,
        totalAmount: 600,
        paymentMethod: 'Cash',
        customerName: 'Neha Gupta',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        notes: ''
      }
    ];

    await Sale.insertMany(sales);
    console.log('✓ Demo sales created');

    // Create demo expenses
    const expenses = [
      {
        userId,
        category: 'Stock Purchase',
        amount: 5000,
        description: 'Bought rice wholesale',
        paymentMethod: 'Card',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        userId,
        category: 'Shop Rent',
        amount: 15000,
        description: 'Monthly shop rent',
        paymentMethod: 'Cash',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        userId,
        category: 'Electricity',
        amount: 2000,
        description: 'Monthly electricity bill',
        paymentMethod: 'UPI',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        userId,
        category: 'Staff Salary',
        amount: 20000,
        description: 'Staff monthly salary',
        paymentMethod: 'Cash',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId,
        category: 'Marketing',
        amount: 3000,
        description: 'Social media promotion',
        paymentMethod: 'Card',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        userId,
        category: 'Maintenance',
        amount: 1500,
        description: 'Shop maintenance and cleaning supplies',
        paymentMethod: 'Cash',
        date: new Date()
      }
    ];

    await Expense.insertMany(expenses);
    console.log('✓ Demo expenses created');

    // Create demo staff
    const staff = [
      {
        userId,
        name: 'Rohan Patel',
        phone: '+91 8765432109',
        email: 'rohan@smartbiz.com',
        role: 'Manager',
        salary: 25000,
        status: 'Active'
      },
      {
        userId,
        name: 'Priya Singh',
        phone: '+91 7654321098',
        email: 'priya@smartbiz.com',
        role: 'Cashier',
        salary: 15000,
        status: 'Active'
      },
      {
        userId,
        name: 'Vikram Kumar',
        phone: '+91 6543210987',
        email: 'vikram@smartbiz.com',
        role: 'Sales Staff',
        salary: 12000,
        status: 'Active'
      },
      {
        userId,
        name: 'Anjali Sharma',
        phone: '+91 5432109876',
        email: 'anjali@smartbiz.com',
        role: 'Delivery Staff',
        salary: 10000,
        status: 'Inactive'
      }
    ];

    await Staff.insertMany(staff);
    console.log('✓ Demo staff created');

    console.log('\n✅ Seed data inserted successfully!');
    console.log('\n📧 Demo Account:');
    console.log(`   Email: ${demoEmail}`);
    console.log('   Password: supplied through DEMO_PASSWORD\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
