const Product = require('../models/Product');
const User = require('../models/User');

const additionalProductsList = [
  // Groceries / Staples
  {
    name: 'Basmati Rice 1kg',
    sku: 'BASMATI-1KG-001',
    category: 'Groceries',
    purchasePrice: 95,
    sellingPrice: 135,
    stock: 35,
    minimumStock: 8,
    supplier: 'Himalayan Grains Co.'
  },
  {
    name: 'Atta (Whole Wheat) 5kg',
    sku: 'ATTA-5KG-001',
    category: 'Groceries',
    purchasePrice: 210,
    sellingPrice: 260,
    stock: 28,
    minimumStock: 6,
    supplier: 'Aashirvaad Distributors'
  },
  {
    name: 'Refined Sunflower Oil 1L',
    sku: 'SUN-OIL-1L-001',
    category: 'Cooking Items',
    purchasePrice: 115,
    sellingPrice: 145,
    stock: 40,
    minimumStock: 10,
    supplier: 'Fortune Foods'
  },
  {
    name: 'Mustard Oil 1L',
    sku: 'MUSTARD-OIL-1L-001',
    category: 'Cooking Items',
    purchasePrice: 130,
    sellingPrice: 165,
    stock: 25,
    minimumStock: 5,
    supplier: 'Kachi Ghani Mills'
  },

  // Pulses
  {
    name: 'Chana Dal 1kg',
    sku: 'CHANA-DAL-1KG-001',
    category: 'Pulses',
    purchasePrice: 78,
    sellingPrice: 98,
    stock: 30,
    minimumStock: 8,
    supplier: 'Pulse Traders'
  },
  {
    name: 'Urad Dal (Split) 1kg',
    sku: 'URAD-DAL-1KG-001',
    category: 'Pulses',
    purchasePrice: 115,
    sellingPrice: 140,
    stock: 22,
    minimumStock: 5,
    supplier: 'Pulse Traders'
  },

  // Beverages
  {
    name: 'Green Tea 25 Bags',
    sku: 'GREEN-TEA-25B-001',
    category: 'Beverages',
    purchasePrice: 140,
    sellingPrice: 190,
    stock: 24,
    minimumStock: 5,
    supplier: 'Organic India Traders'
  },
  {
    name: 'Fruit Juice 1L',
    sku: 'JUICE-1L-001',
    category: 'Beverages',
    purchasePrice: 85,
    sellingPrice: 120,
    stock: 32,
    minimumStock: 8,
    supplier: 'Real Beverages Ltd'
  },
  {
    name: 'Mineral Water 1L',
    sku: 'WATER-1L-001',
    category: 'Beverages',
    purchasePrice: 12,
    sellingPrice: 20,
    stock: 60,
    minimumStock: 15,
    supplier: 'Bisleri Aqua Supply'
  },

  // Snacks & Packaged Foods
  {
    name: 'Instant Noodles 4-Pack',
    sku: 'NOODLES-4PK-001',
    category: 'Snacks',
    purchasePrice: 48,
    sellingPrice: 60,
    stock: 45,
    minimumStock: 10,
    supplier: 'Nestle Distribution'
  },
  {
    name: 'Potato Chips 50g',
    sku: 'CHIPS-50G-001',
    category: 'Snacks',
    purchasePrice: 15,
    sellingPrice: 20,
    stock: 50,
    minimumStock: 12,
    supplier: 'Frito-Lay India'
  },
  {
    name: 'Roasted Peanuts 200g',
    sku: 'PEANUTS-200G-001',
    category: 'Snacks',
    purchasePrice: 45,
    sellingPrice: 65,
    stock: 30,
    minimumStock: 8,
    supplier: 'Haldiram Snacks'
  },
  {
    name: 'Tomato Ketchup 500g',
    sku: 'KETCHUP-500G-001',
    category: 'Groceries',
    purchasePrice: 85,
    sellingPrice: 115,
    stock: 25,
    minimumStock: 5,
    supplier: 'Kissan Foods'
  },

  // Dairy & Breakfast
  {
    name: 'Butter 100g',
    sku: 'BUTTER-100G-001',
    category: 'Dairy',
    purchasePrice: 46,
    sellingPrice: 58,
    stock: 26,
    minimumStock: 6,
    supplier: 'Amul Dairy Depot'
  },
  {
    name: 'Paneer 200g',
    sku: 'PANEER-200G-001',
    category: 'Dairy',
    purchasePrice: 72,
    sellingPrice: 90,
    stock: 18,
    minimumStock: 5,
    supplier: 'Amul Dairy Depot'
  },

  // Personal Care
  {
    name: 'Toothpaste 150g',
    sku: 'TOOTHPASTE-150G-001',
    category: 'Personal Care',
    purchasePrice: 75,
    sellingPrice: 105,
    stock: 35,
    minimumStock: 8,
    supplier: 'Colgate Consumer Care'
  },
  {
    name: 'Hair Shampoo 180ml',
    sku: 'SHAMPOO-180ML-001',
    category: 'Personal Care',
    purchasePrice: 110,
    sellingPrice: 150,
    stock: 20,
    minimumStock: 5,
    supplier: 'Personal Care Wholesale'
  },

  // Household Essentials
  {
    name: 'Dishwash Liquid 500ml',
    sku: 'DISHWASH-500ML-001',
    category: 'Household',
    purchasePrice: 82,
    sellingPrice: 110,
    stock: 30,
    minimumStock: 8,
    supplier: 'CleanHome Distributors'
  },
  {
    name: 'Floor Cleaner 1L',
    sku: 'FLOOR-CLEANER-1L-001',
    category: 'Household',
    purchasePrice: 95,
    sellingPrice: 135,
    stock: 22,
    minimumStock: 5,
    supplier: 'CleanHome Distributors'
  }
];

/**
 * Idempotently seeds the 19 additional retail products for all existing users.
 * Checks existing names and SKUs to prevent duplicates.
 */
async function seedAdditionalProducts() {
  try {
    const users = await User.find({}, '_id email');
    if (!users.length) return { inserted: 0, skipped: 0 };

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const user of users) {
      for (const item of additionalProductsList) {
        // Check if product with this SKU or Name already exists for this user
        const exists = await Product.findOne({
          userId: user._id,
          $or: [
            { sku: item.sku },
            { name: { $regex: new RegExp(`^${item.name}$`, 'i') } }
          ]
        });

        if (exists) {
          totalSkipped++;
          continue;
        }

        await Product.create({
          userId: user._id,
          name: item.name,
          sku: item.sku,
          category: item.category,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          stock: item.stock,
          minimumStock: item.minimumStock,
          supplier: item.supplier
        });
        totalInserted++;
      }
    }

    return { inserted: totalInserted, skipped: totalSkipped };
  } catch (err) {
    console.error('Error seeding additional products:', err);
    return { inserted: 0, skipped: 0, error: err.message };
  }
}

module.exports = seedAdditionalProducts;
module.exports.additionalProductsList = additionalProductsList;
