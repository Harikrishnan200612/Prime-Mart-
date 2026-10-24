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
      ['Soap 100g', 'SOAP-100G-001', 'Personal Care', 28, 42, 32, 8, 'Personal Care Wholesale'],
      ['Basmati Rice 1kg', 'BASMATI-1KG-001', 'Groceries', 95, 135, 35, 8, 'Himalayan Grains Co.'],
      ['Atta (Whole Wheat) 5kg', 'ATTA-5KG-001', 'Groceries', 210, 260, 28, 6, 'Aashirvaad Distributors'],
      ['Refined Sunflower Oil 1L', 'SUN-OIL-1L-001', 'Cooking Items', 115, 145, 40, 10, 'Fortune Foods'],
      ['Mustard Oil 1L', 'MUSTARD-OIL-1L-001', 'Cooking Items', 130, 165, 25, 5, 'Kachi Ghani Mills'],
      ['Chana Dal 1kg', 'CHANA-DAL-1KG-001', 'Pulses', 78, 98, 30, 8, 'Pulse Traders'],
      ['Urad Dal (Split) 1kg', 'URAD-DAL-1KG-001', 'Pulses', 115, 140, 22, 5, 'Pulse Traders'],
      ['Green Tea 25 Bags', 'GREEN-TEA-25B-001', 'Beverages', 140, 190, 24, 5, 'Organic India Traders'],
      ['Fruit Juice 1L', 'JUICE-1L-001', 'Beverages', 85, 120, 32, 8, 'Real Beverages Ltd'],
      ['Mineral Water 1L', 'WATER-1L-001', 'Beverages', 12, 20, 60, 15, 'Bisleri Aqua Supply'],
      ['Instant Noodles 4-Pack', 'NOODLES-4PK-001', 'Snacks', 48, 60, 45, 10, 'Nestle Distribution'],
      ['Potato Chips 50g', 'CHIPS-50G-001', 'Snacks', 15, 20, 50, 12, 'Frito-Lay India'],
      ['Roasted Peanuts 200g', 'PEANUTS-200G-001', 'Snacks', 45, 65, 30, 8, 'Haldiram Snacks'],
      ['Tomato Ketchup 500g', 'KETCHUP-500G-001', 'Groceries', 85, 115, 25, 5, 'Kissan Foods'],
      ['Butter 100g', 'BUTTER-100G-001', 'Dairy', 46, 58, 26, 6, 'Amul Dairy Depot'],
      ['Paneer 200g', 'PANEER-200G-001', 'Dairy', 72, 90, 18, 5, 'Amul Dairy Depot'],
      ['Toothpaste 150g', 'TOOTHPASTE-150G-001', 'Personal Care', 75, 105, 35, 8, 'Colgate Consumer Care'],
      ['Hair Shampoo 180ml', 'SHAMPOO-180ML-001', 'Personal Care', 110, 150, 20, 5, 'Personal Care Wholesale'],
      ['Dishwash Liquid 500ml', 'DISHWASH-500ML-001', 'Household', 82, 110, 30, 8, 'CleanHome Distributors'],
      ['Floor Cleaner 1L', 'FLOOR-CLEANER-1L-001', 'Household', 95, 135, 22, 5, 'CleanHome Distributors']
    ];
    const products = productCatalog.map(([name, sku, category, purchasePrice, sellingPrice, stock, minimumStock, supplier]) => ({
      userId, name, sku, category, purchasePrice, sellingPrice, stock, minimumStock, supplier
    }));

    const savedProducts = await Product.insertMany(products);
    console.log('✓ Demo products created');

    // Create demo sales (one sale = one customer = many products)
    const day = 24 * 60 * 60 * 1000;
    const byName = (name) => savedProducts.find((product) => product.name === name);
    const line = (name, quantity) => {
      const product = byName(name);
      return {
        productId: product._id,
        productName: product.name,
        quantity,
        unitPrice: product.sellingPrice,
        subtotal: quantity * product.sellingPrice
      };
    };
    const demoSales = [
      { customerName: 'Rajesh Kumar', paymentMethod: 'Cash', daysAgo: 3, discount: 0, tax: 0, notes: 'Bulk purchase',
        items: [line('Rice 5kg', 2), line('Sugar 1kg', 3), line('Cooking Oil 1L', 2)] },
      { customerName: 'Priya Sharma', paymentMethod: 'UPI', daysAgo: 2, discount: 10, tax: 0, notes: '',
        items: [line('Wheat Flour 2kg', 1), line('Tea Leaves 250g', 2)] },
      { customerName: 'Walk-in Customer', paymentMethod: 'Card', daysAgo: 1, discount: 0, tax: 27, notes: '',
        items: [line('Cooking Oil 1L', 3)] },
      { customerName: 'Amit Singh', paymentMethod: 'Cash', daysAgo: 0, discount: 0, tax: 0, notes: '',
        items: [line('Rice 5kg', 1), line('Soap 100g', 4)] },
      { customerName: 'Walk-in Customer', paymentMethod: 'UPI', daysAgo: 0, discount: 0, tax: 0, notes: '',
        items: [line('Sugar 1kg', 5)] }
    ];

    const sales = demoSales.map((sale, index) => {
      const subtotal = sale.items.reduce((sum, item) => sum + item.subtotal, 0);
      return {
        userId,
        saleNumber: index + 1,
        invoiceNumber: `SALE-${String(index + 1).padStart(3, '0')}`,
        customerName: sale.customerName,
        items: sale.items,
        subtotal,
        discount: sale.discount,
        tax: sale.tax,
        totalAmount: subtotal - sale.discount + sale.tax,
        paymentMethod: sale.paymentMethod,
        date: new Date(Date.now() - sale.daysAgo * day),
        notes: sale.notes
      };
    });

    await Sale.insertMany(sales);
    await User.updateOne({ _id: userId }, { $set: { saleCounter: sales.length } });
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
