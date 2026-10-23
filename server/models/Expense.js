const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: [
      'Stock Purchase',
      'Inventory Purchase',
      'Shop Rent',
      'Electricity',
      'Water',
      'Internet',
      'Staff Salary',
      'Transportation',
      'Maintenance',
      'Marketing',
      'Other'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card'],
    default: 'Cash'
  },
  notes: String,
  // Linked inventory purchase metadata
  purchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productName: String,
  sku: String,
  quantity: Number,
  unitCost: Number,
  supplier: String,
  purchaseReference: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index(
  { userId: 1, purchaseReference: 1 },
  { unique: true, partialFilterExpression: { purchaseReference: { $type: 'string' } } }
);

module.exports = mongoose.model('Expense', expenseSchema);
