const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

// Get all sales
router.get('/', auth, async (req, res) => {
  try {
    const { search, paymentMethod, startDate, endDate } = req.query;
    const query = { userId: req.userId };

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const sales = await Sale.find(query).sort({ date: -1 }).populate('productId');
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sales' });
  }
});

// Get single sale
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, userId: req.userId }).populate('productId');
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sale' });
  }
});

// Add sale
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity, sellingPrice, paymentMethod, customerName, notes } = req.body;

    if (!productId || !quantity || !sellingPrice || !paymentMethod) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const product = await Product.findOne({ _id: productId, userId: req.userId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Available: ${product.stock}` });
    }

    const totalAmount = quantity * sellingPrice;

    const newSale = new Sale({
      userId: req.userId,
      productId,
      productName: product.name,
      quantity,
      sellingPrice,
      totalAmount,
      paymentMethod,
      customerName: customerName || 'Walk-in Customer',
      notes: notes || ''
    });

    await newSale.save();

    // Reduce inventory
    product.stock -= quantity;
    await product.save();

    // Create notification for low/out of stock
    if (product.stock <= 0) {
      const notification = new Notification({
        userId: req.userId,
        type: 'out-of-stock',
        title: '🔴 Out of Stock',
        message: `${product.name} is now out of stock.`,
        related: 'product',
        relatedId: productId
      });
      await notification.save();
    } else if (product.stock <= product.minimumStock) {
      const notification = new Notification({
        userId: req.userId,
        type: 'low-stock',
        title: '⚠️ Low Stock',
        message: `${product.name} has only ${product.stock} units remaining.`,
        related: 'product',
        relatedId: productId
      });
      await notification.save();
    }

    res.status(201).json(newSale);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add sale' });
  }
});

// Update sale
router.put('/:id', auth, async (req, res) => {
  try {
    const { quantity, sellingPrice, paymentMethod, customerName, notes } = req.body;

    const oldSale = await Sale.findOne({ _id: req.params.id, userId: req.userId });
    if (!oldSale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const product = await Product.findById(oldSale.productId);

    // If quantity changed, adjust inventory
    if (quantity && quantity !== oldSale.quantity) {
      const diff = oldSale.quantity - quantity;
      if (product.stock + diff < 0) {
        return res.status(400).json({ message: 'Insufficient stock for this change' });
      }
      product.stock += diff;
      await product.save();
    }

    if (quantity) oldSale.quantity = quantity;
    if (sellingPrice) oldSale.sellingPrice = sellingPrice;
    if (paymentMethod) oldSale.paymentMethod = paymentMethod;
    if (customerName) oldSale.customerName = customerName;
    if (notes) oldSale.notes = notes;

    oldSale.totalAmount = oldSale.quantity * oldSale.sellingPrice;
    await oldSale.save();

    res.json(oldSale);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update sale' });
  }
});

// Delete sale
router.delete('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, userId: req.userId });
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Restore inventory
    const product = await Product.findById(sale.productId);
    if (product) {
      product.stock += sale.quantity;
      await product.save();
    }

    await Sale.deleteOne({ _id: req.params.id });

    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete sale' });
  }
});

module.exports = router;
