const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const auth = require('../middleware/auth');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Product = require('../models/Product');

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Convert userId to MongoDB ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ==========================================
    // TOTAL SALES
    // ==========================================
    const salesData = await Sale.aggregate([
      {
        $match: {
          userId: userObjectId
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$totalAmount'
          }
        }
      }
    ]);

    const totalSales = salesData[0]?.total || 0;

    // ==========================================
    // TODAY'S SALES
    // ==========================================
    const todaysSalesData = await Sale.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$totalAmount'
          }
        }
      }
    ]);

    const todaysSales = todaysSalesData[0]?.total || 0;

    // ==========================================
    // TOTAL EXPENSES
    // ==========================================
    const expensesData = await Expense.aggregate([
      {
        $match: {
          userId: userObjectId
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$amount'
          }
        }
      }
    ]);

    const totalExpenses = expensesData[0]?.total || 0;

    // ==========================================
    // TODAY'S EXPENSES
    // ==========================================
    const todaysExpensesData = await Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$amount'
          }
        }
      }
    ]);

    const todaysExpenses = todaysExpensesData[0]?.total || 0;

    // ==========================================
    // NET PROFIT / LOSS
    // ==========================================
    const netProfit = totalSales - totalExpenses;
    const todaysProfit = todaysSales - todaysExpenses;

    // ==========================================
    // PROFIT MARGIN
    // ==========================================
    const profitMargin =
      totalSales > 0
        ? Number(((netProfit / totalSales) * 100).toFixed(2))
        : 0;

    // ==========================================
    // TRANSACTION COUNT
    // ==========================================
    const salesCount = await Sale.countDocuments({
      userId: userObjectId
    });

    const expenseCount = await Expense.countDocuments({
      userId: userObjectId
    });

    // ==========================================
    // LOW STOCK PRODUCTS
    // ==========================================
    const lowStockProducts = await Product.countDocuments({
      userId: userObjectId,
      $expr: {
        $lte: ['$stock', '$minimumStock']
      }
    });

    // ==========================================
    // RESPONSE
    // ==========================================
    res.json({
      totalSales,
      totalExpenses,
      netProfit,
      profitMargin,
      todaysSales,
      todaysExpenses,
      todaysProfit,
      transactionCount: salesCount + expenseCount,
      lowStockCount: lowStockProducts
    });

  } catch (err) {
    console.error('Dashboard Error:', err);

    res.status(500).json({
      message: 'Failed to fetch dashboard data',
      error: err.message
    });
  }
});

module.exports = router;