const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const { runAtomic, round2 } = require('../utils/saleUtils');

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = { userId: req.userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.userId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Add product (catalog definition - does not record purchase expenses)
router.post('/', auth, async (req, res) => {
  try {
    const { name, sku, category, purchasePrice, sellingPrice, stock, minimumStock, supplier } = req.body;

    if (!name || !sku || !category || purchasePrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const newProduct = new Product({
      userId: req.userId,
      name,
      sku,
      category,
      purchasePrice,
      sellingPrice,
      stock: stock || 0,
      minimumStock: minimumStock || 5,
      supplier: supplier || ''
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add product' });
  }
});

// Update product (editing details / manual stock adjustment - does not create expenses)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, sku, category, purchasePrice, sellingPrice, stock, minimumStock, supplier } = req.body;

    const product = await Product.findOne({ _id: req.params.id, userId: req.userId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name) product.name = name;
    if (sku) product.sku = sku;
    if (category) product.category = category;
    if (purchasePrice !== undefined) product.purchasePrice = purchasePrice;
    if (sellingPrice !== undefined) product.sellingPrice = sellingPrice;
    if (stock !== undefined) product.stock = stock;
    if (minimumStock !== undefined) product.minimumStock = minimumStock;
    if (supplier !== undefined) product.supplier = supplier;

    product.updatedAt = Date.now();
    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

/**
 * Common handler for recording an inventory purchase.
 * 1. Checks for idempotent retries using purchaseReference.
 * 2. Increases product stock.
 * 3. Records a Purchase transaction.
 * 4. Automatically records an Expense in category 'Stock Purchase'.
 * Runs atomically with rollback safety.
 */
const handleInventoryPurchase = async (req, res) => {
  try {
    const { quantity } = req.body;
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const product = await Product.findOne({ _id: req.params.id, userId: req.userId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const rawUnitCost = req.body.unitCost !== undefined
      ? req.body.unitCost
      : (req.body.purchasePrice !== undefined ? req.body.purchasePrice : product.purchasePrice);
    const unitCost = Number(rawUnitCost);
    if (isNaN(unitCost) || unitCost < 0) {
      return res.status(400).json({ message: 'Invalid purchase price per unit' });
    }

    const totalAmount = round2(qty * unitCost);
    const supplier = (req.body.supplier !== undefined ? String(req.body.supplier) : product.supplier) || '';
    const paymentMethod = ['Cash', 'UPI', 'Card'].includes(req.body.paymentMethod) ? req.body.paymentMethod : 'Cash';
    const purchaseDate = req.body.date ? new Date(req.body.date) : new Date();

    // Idempotency / duplicate check
    const purchaseReference = req.body.purchaseReference || req.body.reference || req.body.transactionId;
    if (purchaseReference) {
      const existingPurchase = await Purchase.findOne({ userId: req.userId, purchaseReference });
      if (existingPurchase) {
        return res.json({
          ...product.toObject(),
          purchase: existingPurchase,
          message: 'Purchase already recorded (duplicate prevented)'
        });
      }
    }

    const finalReference = purchaseReference || `PUR-${Date.now()}-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;

    const result = await runAtomic(async (ctx) => {
      const opts = ctx.session ? { session: ctx.session } : {};

      // 1. Increase product stock
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id, userId: req.userId },
        {
          $inc: { stock: qty },
          $set: {
            updatedAt: new Date(),
            ...(req.body.updatePurchasePrice ? { purchasePrice: unitCost } : {})
          }
        },
        { new: true, ...opts }
      );
      ctx.undo.push(() => Product.updateOne({ _id: product._id }, { $inc: { stock: -qty } }));

      // 2. Save inventory purchase transaction
      const [purchase] = await Purchase.create([{
        userId: req.userId,
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        unitCost,
        totalAmount,
        supplier,
        paymentMethod,
        date: purchaseDate,
        purchaseReference: finalReference,
        notes: req.body.notes || ''
      }], opts);
      ctx.undo.push(() => Purchase.deleteOne({ _id: purchase._id }));

      // 3. Automatically create corresponding expense record
      const [expense] = await Expense.create([{
        userId: req.userId,
        category: 'Stock Purchase',
        amount: totalAmount,
        description: `Inventory Purchase: ${product.name} (${product.sku}) - ${qty} units @ ₹${unitCost}${supplier ? ` from ${supplier}` : ''}`,
        paymentMethod,
        date: purchaseDate,
        purchaseId: purchase._id,
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        unitCost,
        supplier,
        purchaseReference: finalReference,
        notes: req.body.notes || ''
      }], opts);
      ctx.undo.push(() => Expense.deleteOne({ _id: expense._id }));

      // Link expense to purchase
      purchase.expenseId = expense._id;
      await purchase.save(opts);

      return { product: updatedProduct, purchase, expense };
    });

    res.status(201).json({
      ...result.product.toObject(),
      purchase: result.purchase,
      expense: result.expense
    });
  } catch (err) {
    console.error('Inventory purchase error:', err);
    res.status(500).json({ message: 'Failed to record inventory purchase', error: err.message });
  }
};

// Increase stock / Record inventory purchase
router.post('/:id/increase-stock', auth, handleInventoryPurchase);
router.post('/:id/purchase', auth, handleInventoryPurchase);

// Cancel / Reverse an inventory purchase
router.post('/purchases/:purchaseId/cancel', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ _id: req.params.purchaseId, userId: req.userId });
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase transaction not found' });
    }
    if (purchase.status === 'Cancelled') {
      return res.status(400).json({ message: 'Purchase is already cancelled' });
    }

    await runAtomic(async (ctx) => {
      const opts = ctx.session ? { session: ctx.session } : {};

      // 1. Decrease product stock by purchased quantity
      await Product.updateOne(
        { _id: purchase.productId, userId: req.userId },
        { $inc: { stock: -purchase.quantity }, $set: { updatedAt: new Date() } },
        opts
      );
      ctx.undo.push(() => Product.updateOne({ _id: purchase.productId }, { $inc: { stock: purchase.quantity } }));

      // 2. Mark purchase as cancelled
      purchase.status = 'Cancelled';
      await purchase.save(opts);

      // 3. Delete linked expense
      if (purchase.expenseId) {
        await Expense.deleteOne({ _id: purchase.expenseId, userId: req.userId }, opts);
      }
    });

    res.json({ message: 'Purchase cancelled and linked expense reversed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel purchase' });
  }
});

// Decrease stock (wastage / damage / stock adjustment - does not create expense)
router.post('/:id/decrease-stock', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const product = await Product.findOne({ _id: req.params.id, userId: req.userId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < qty) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    product.stock -= qty;
    product.updatedAt = Date.now();
    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to decrease stock' });
  }
});

module.exports = router;
