const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
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
  productName: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card'],
    required: true
  },
  customerName: {
    type: String,
    default: 'Walk-in Customer'
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
saleSchema.index({ userId: 1, date: -1 });
saleSchema.index({ paymentMethod: 1 });

module.exports = mongoose.model('Sale', saleSchema);
