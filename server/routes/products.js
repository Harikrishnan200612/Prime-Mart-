const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

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

// Add product
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

// Update product
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

// Increase stock
router.post('/:id/increase-stock', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const product = await Product.findOne({ _id: req.params.id, userId: req.userId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.stock += quantity;
    product.updatedAt = Date.now();
    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to increase stock' });
  }
});

// Decrease stock
router.post('/:id/decrease-stock', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const product = await Product.findOne({ _id: req.params.id, userId: req.userId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    product.stock -= quantity;
    product.updatedAt = Date.now();
    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to decrease stock' });
  }
});

module.exports = router;
