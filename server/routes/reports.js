const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const auth = require('../middleware/auth');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Product = require('../models/Product');

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const getDateRange = (period = 'month', customStart, customEnd) => {
  if (customStart || customEnd) {
    const start = customStart ? startOfDay(customStart) : new Date(0);
    const end = customEnd ? endOfDay(customEnd) : endOfDay(new Date());
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error('Invalid date range');
    }
    return { startDate: start, endDate: end };
  }

  const endDate = endOfDay(new Date());
  const startDate = startOfDay(new Date());
  if (period === 'today') return { startDate, endDate };
  if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
  else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
  else return { startDate: new Date(0), endDate };
  return { startDate, endDate };
};

const buildDateFilter = (req) => {
  const { period = 'month', startDate, endDate } = req.query;
  const range = getDateRange(period, startDate, endDate);
  return { $gte: range.startDate, $lte: range.endDate };
};

// Validate user and create ObjectId
const getUserObjectId = (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error('Invalid user ID');
  }
  return new mongoose.Types.ObjectId(userId);
};

// Sales report
router.get('/sales', auth, async (req, res) => {
  try {
    const userObjectId = getUserObjectId(req.userId);

    const dateFilter = buildDateFilter(req);

    const sales = await Sale.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date'
            }
          },
          total: {
            $sum: '$totalAmount'
          },
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]);

    res.json(sales.map(({ _id, total, count }) => ({ date: _id, total, count })));
  } catch (err) {
    console.error('Sales report error:', err);

    res.status(500).json({
      message: 'Failed to fetch sales report'
    });
  }
});

// Expense report
router.get('/expenses', auth, async (req, res) => {
  try {
    const userObjectId = getUserObjectId(req.userId);

    const dateFilter = buildDateFilter(req);

    const expenses = await Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: dateFilter
        }
      },
      {
        $group: {
          _id: '$category',
          total: {
            $sum: '$amount'
          },
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          total: -1
        }
      }
    ]);

    res.json(expenses);
  } catch (err) {
    console.error('Expense report error:', err);

    res.status(500).json({
      message: 'Failed to fetch expense report'
    });
  }
});

// Profit report
router.get('/profit', auth, async (req, res) => {
  try {
    const userObjectId = getUserObjectId(req.userId);

    const dateFilter = buildDateFilter(req);

    const salesData = await Sale.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date'
            }
          },
          sales: {
            $sum: '$totalAmount'
          }
        }
      }
    ]);

    const expensesData = await Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date'
            }
          },
          expenses: {
            $sum: '$amount'
          }
        }
      }
    ]);

    const profitData = {};

    salesData.forEach(item => {
      profitData[item._id] = {
        sales: item.sales,
        expenses: 0
      };
    });

    expensesData.forEach(item => {
      if (profitData[item._id]) {
        profitData[item._id].expenses = item.expenses;
      } else {
        profitData[item._id] = {
          sales: 0,
          expenses: item.expenses
        };
      }
    });

    const result = Object.entries(profitData)
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        expenses: data.expenses,
        profit: data.sales - data.expenses
      }))
      .sort(
        (a, b) =>
          new Date(a.date) - new Date(b.date)
      );

    res.json(result);
  } catch (err) {
    console.error('Profit report error:', err);

    res.status(500).json({
      message: 'Failed to fetch profit report'
    });
  }
});

// Payment method report
router.get('/payment-methods', auth, async (req, res) => {
  try {
    const userObjectId = getUserObjectId(req.userId);

    const dateFilter = buildDateFilter(req);

    const paymentMethods = await Sale.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: dateFilter
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: {
            $sum: '$totalAmount'
          },
          count: {
            $sum: 1
          }
        }
      }
    ]);

    const totalAmount = paymentMethods.reduce(
      (sum, method) => sum + method.total,
      0
    );

    const result = paymentMethods.map(method => ({
      method: method._id,
      total: method.total,
      count: method.count,
      percentage:
        totalAmount > 0
          ? ((method.total / totalAmount) * 100).toFixed(2)
          : '0.00'
    }));

    res.json(result);
  } catch (err) {
    console.error('Payment methods report error:', err);

    res.status(500).json({
      message: 'Failed to fetch payment methods report'
    });
  }
});

// Top products report
router.get('/top-products', auth, async (req, res) => {
  try {
    const userObjectId = getUserObjectId(req.userId);

    const {
      limit = 10
    } = req.query;

    const dateFilter = buildDateFilter(req);

    const parsedLimit = Math.max(
      1,
      Math.min(parseInt(limit, 10) || 10, 100)
    );

    const topProducts = await Sale.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: dateFilter
        }
      },
      {
        $group: {
          _id: '$productName',
          totalQuantity: {
            $sum: '$quantity'
          },
          totalRevenue: {
            $sum: '$totalAmount'
          },
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          totalRevenue: -1
        }
      },
      {
        $limit: parsedLimit
      }
    ]);

    res.json(topProducts);
  } catch (err) {
    console.error('Top products report error:', err);

    res.status(500).json({
      message: 'Failed to fetch top products report'
    });
  }
});

module.exports = router;