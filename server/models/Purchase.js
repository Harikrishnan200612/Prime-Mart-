const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  purchaseReference: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card'],
    default: 'Cash'
  },
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  },
  status: {
    type: String,
    enum: ['Completed', 'Cancelled'],
    default: 'Completed'
  },
  notes: {
    type: String,
    default: ''
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

purchaseSchema.index({ userId: 1, purchaseReference: 1 }, { unique: true });
purchaseSchema.index({ userId: 1, date: -1 });
purchaseSchema.index({ productId: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
