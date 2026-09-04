const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');

// Get all expenses
router.get('/', auth, async (req, res) => {
  try {
    const { category, search, startDate, endDate } = req.query;
    const query = { userId: req.userId };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
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

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
});

// Get single expense
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch expense' });
  }
});

// Add expense
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, description, paymentMethod, notes } = req.body;

    if (!category || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Required fields missing or invalid' });
    }

    const newExpense = new Expense({
      userId: req.userId,
      category,
      amount,
      description: description || '',
      paymentMethod: paymentMethod || 'Cash',
      notes: notes || ''
    });

    await newExpense.save();

    // Create notification for large expenses (if > 50000)
    if (amount > 50000) {
      const notification = new Notification({
        userId: req.userId,
        type: 'large-expense',
        title: '💰 Large Expense',
        message: `Large expense of ₹${amount} recorded in ${category}.`,
        related: 'expense',
        relatedId: newExpense._id
      });
      await notification.save();
    }

    res.status(201).json(newExpense);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add expense' });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const { category, amount, description, paymentMethod, notes } = req.body;

    const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (category) expense.category = category;
    if (amount) expense.amount = amount;
    if (description) expense.description = description;
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (notes) expense.notes = notes;

    expense.updatedAt = Date.now();
    await expense.save();

    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete expense' });
  }
});

module.exports = router;
