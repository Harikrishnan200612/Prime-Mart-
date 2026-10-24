const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const auth = require('../middleware/auth');
const Sale = require('../models/Sale');
const { normalizeItemsStage, round2 } = require('../utils/saleUtils');
const Expense = require('../models/Expense');
const Product = require('../models/Product');

const INVENTORY_CATEGORIES = ['Stock Purchase', 'Inventory Purchase'];

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Date boundaries for today (supports optional query date or defaults to local server today)
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    if (req.query.date) {
      const parsed = new Date(req.query.date);
      if (!isNaN(parsed.getTime())) {
        today = new Date(parsed);
        today.setHours(0, 0, 0, 0);
      }
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ==========================================
    // 1. OVERALL SALES & COGS
    // ==========================================
    const salesAgg = await Sale.aggregate([
      { $match: { userId: userObjectId } },
      normalizeItemsStage,
      {
        $project: {
          totalAmount: 1,
          cogs: {
            $cond: [
              { $gt: [{ $ifNull: ['$costOfGoodsSold', 0] }, 0] },
              '$costOfGoodsSold',
              {
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: {
                    $add: [
                      '$$value',
                      {
                        $multiply: [
                          { $ifNull: ['$$this.quantity', 0] },
                          { $ifNull: ['$$this.unitCost', 0] }
                        ]
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalCogs: { $sum: '$cogs' }
        }
      }
    ]);

    const totalSales = round2(salesAgg[0]?.totalSales || 0);
    const cogs = round2(salesAgg[0]?.totalCogs || 0);

    // ==========================================
    // 2. TODAY'S SALES & COGS
    // ==========================================
    const todaysSalesAgg = await Sale.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: today, $lt: tomorrow }
        }
      },
      normalizeItemsStage,
      {
        $project: {
          totalAmount: 1,
          cogs: {
            $cond: [
              { $gt: [{ $ifNull: ['$costOfGoodsSold', 0] }, 0] },
              '$costOfGoodsSold',
              {
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: {
                    $add: [
                      '$$value',
                      {
                        $multiply: [
                          { $ifNull: ['$$this.quantity', 0] },
                          { $ifNull: ['$$this.unitCost', 0] }
                        ]
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalCogs: { $sum: '$cogs' },
          count: { $sum: 1 }
        }
      }
    ]);

    const todaysSales = round2(todaysSalesAgg[0]?.totalSales || 0);
    const todaysCogs = round2(todaysSalesAgg[0]?.totalCogs || 0);
    const todaysSalesCount = todaysSalesAgg[0]?.count || 0;

    // ==========================================
    // 3. OVERALL EXPENSES (Inventory vs Operating)
    // ==========================================
    const expensesAgg = await Expense.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          inventoryExpenses: {
            $sum: {
              $cond: [{ $in: ['$category', INVENTORY_CATEGORIES] }, '$amount', 0]
            }
          },
          operatingExpenses: {
            $sum: {
              $cond: [{ $not: [{ $in: ['$category', INVENTORY_CATEGORIES] }] }, '$amount', 0]
            }
          }
        }
      }
    ]);

    const totalExpenses = round2(expensesAgg[0]?.totalExpenses || 0);
    const inventoryExpenses = round2(expensesAgg[0]?.inventoryExpenses || 0);
    const operatingExpenses = round2(expensesAgg[0]?.operatingExpenses || 0);

    // ==========================================
    // 4. TODAY'S EXPENSES (Inventory vs Operating)
    // ==========================================
    const todaysExpensesAgg = await Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          inventoryExpenses: {
            $sum: {
              $cond: [{ $in: ['$category', INVENTORY_CATEGORIES] }, '$amount', 0]
            }
          },
          operatingExpenses: {
            $sum: {
              $cond: [{ $not: [{ $in: ['$category', INVENTORY_CATEGORIES] }] }, '$amount', 0]
            }
          }
        }
      }
    ]);

    const todaysExpenses = round2(todaysExpensesAgg[0]?.totalExpenses || 0);
    const todaysInventoryExpenses = round2(todaysExpensesAgg[0]?.inventoryExpenses || 0);
    const todaysOperatingExpenses = round2(todaysExpensesAgg[0]?.operatingExpenses || 0);

    // ==========================================
    // 5. PROFIT CALCULATIONS (Gross & Net)
    // ==========================================
    // Gross Profit = Net Sales Revenue - COGS
    const grossProfit = round2(totalSales - cogs);
    const grossMargin = totalSales > 0 ? Number(((grossProfit / totalSales) * 100).toFixed(2)) : 0;

    // Net Profit = Gross Profit - Operating Expenses
    // (Prevents double counting: unsold inventory remains an asset, cost of sold inventory is COGS)
    const netProfit = round2(grossProfit - operatingExpenses);
    const netProfitMargin = totalSales > 0 ? Number(((netProfit / totalSales) * 100).toFixed(2)) : 0;

    // Today's Gross Profit = Today's Sales - Today's COGS
    const todaysGrossProfit = round2(todaysSales - todaysCogs);
    const todaysGrossMargin = todaysSales > 0 ? Number(((todaysGrossProfit / todaysSales) * 100).toFixed(2)) : 0;

    // Today's Net Profit = Today's Gross Profit - Today's Operating Expenses
    const todaysProfit = round2(todaysGrossProfit - todaysOperatingExpenses);

    // ==========================================
    // 6. TRANSACTION STATS
    // ==========================================
    const salesCount = await Sale.countDocuments({ userId: userObjectId });
    const expenseCount = await Expense.countDocuments({ userId: userObjectId });

    const itemStats = await Sale.aggregate([
      { $match: { userId: userObjectId } },
      normalizeItemsStage,
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          unitsSold: { $sum: '$items.quantity' },
          productLinesSold: { $sum: 1 }
        }
      }
    ]);

    const unitsSold = itemStats[0]?.unitsSold || 0;
    const productLinesSold = itemStats[0]?.productLinesSold || 0;

    // ==========================================
    // 7. INVENTORY VALUATION & STOCK STATS
    // Total Inventory Value = Sum of (Available Stock Quantity × Unit Purchase Cost)
    // ==========================================
    const inventoryValAgg = await Product.aggregate([
      { $match: { userId: userObjectId, isDeleted: { $ne: true } } },
      {
        $project: {
          stock: { $ifNull: ['$stock', 0] },
          purchasePrice: { $ifNull: ['$purchasePrice', 0] },
          itemValue: {
            $multiply: [
              { $max: [{ $ifNull: ['$stock', 0] }, 0] },
              { $max: [{ $ifNull: ['$purchasePrice', 0] }, 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalInventoryValue: { $sum: '$itemValue' },
          totalStockUnits: { $sum: '$stock' },
          productCount: { $sum: 1 }
        }
      }
    ]);

    const totalInventoryValue = round2(inventoryValAgg[0]?.totalInventoryValue || 0);
    const totalStockUnits = inventoryValAgg[0]?.totalStockUnits || 0;
    const totalProductsCount = inventoryValAgg[0]?.productCount || 0;

    // ==========================================
    // 8. LOW STOCK & INCOMPLETE COST CHECKS
    // ==========================================
    const lowStockProducts = await Product.countDocuments({
      userId: userObjectId,
      $expr: { $lte: ['$stock', '$minimumStock'] }
    });

    const hasIncompleteCostData = Boolean(
      await Sale.exists({ userId: userObjectId, hasIncompleteCost: true })
    );

    // ==========================================
    // 9. FINAL DASHBOARD RESPONSE
    // ==========================================
    res.json({
      // Overall Business Summary (Section A: 6 Cards)
      totalSales,
      totalInventoryValue,
      totalStockUnits,
      productCount: totalProductsCount,
      inventoryExpenses,
      operatingExpenses,
      cogs,
      grossProfit,
      grossMargin,
      netProfit,
      netProfitMargin,
      totalExpenses,

      // Today's Summary (Section B: 6 Cards)
      todaysSales,
      todaysExpenses,
      todaysProfit,
      lowStockCount: lowStockProducts,
      todaysCogs,
      todaysGrossProfit,
      todaysGrossMargin,
      todaysSalesCount,
      todaysInventoryExpenses,
      todaysOperatingExpenses,

      // Meta / Activity
      transactionCount: salesCount + expenseCount,
      salesCount,
      unitsSold,
      productLinesSold,
      hasIncompleteCostData
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