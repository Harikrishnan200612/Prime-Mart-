const mongoose = require('mongoose');

// One line of a sale. A sale can hold any number of these (one per distinct product).
const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Human readable bill number, e.g. SALE-001 (sequence is per business/user)
  saleNumber: Number,
  invoiceNumber: String,

  customerName: {
    type: String,
    default: 'Walk-in Customer'
  },

  // One sale -> many products
  items: [saleItemSchema],

  subtotal: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
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
  date: {
    type: Date,
    default: Date.now
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },

  // Legacy single-product fields. Sales created before multi-product support
  // still carry these; they are converted into `items` by utils/migrateLegacySales.js
  // and are read through utils/saleUtils.js#getSaleItems for compatibility.
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productName: String,
  quantity: Number,
  sellingPrice: Number
});

// Index for faster queries
saleSchema.index({ userId: 1, date: -1 });
saleSchema.index({ paymentMethod: 1 });
saleSchema.index(
  { userId: 1, invoiceNumber: 1 },
  { unique: true, partialFilterExpression: { invoiceNumber: { $type: 'string' } } }
);

module.exports = mongoose.model('Sale', saleSchema);
