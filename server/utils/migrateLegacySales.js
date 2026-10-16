const Sale = require('../models/Sale');
const User = require('../models/User');
const { formatInvoiceNumber } = require('./saleUtils');

/**
 * One-time, idempotent conversion of old single-product sales into the new
 * multi-product shape (items[], subtotal, discount, tax, SALE-xxx number).
 * Safe to run on every start: it only touches sales that still lack `items`.
 */
const migrateLegacySales = async () => {
  const legacyFilter = { 'items.0': { $exists: false }, productId: { $exists: true } };
  const userIds = await Sale.distinct('userId', legacyFilter);
  let converted = 0;

  for (const userId of userIds) {
    const owner = await User.findById(userId).select('saleCounter');
    const lastIssued = await Sale.findOne({ userId, saleNumber: { $exists: true } })
      .sort({ saleNumber: -1 })
      .select('saleNumber');
    let counter = Math.max(owner?.saleCounter || 0, lastIssued?.saleNumber || 0);

    const legacySales = await Sale.find({ userId, ...legacyFilter }).sort({ date: 1, createdAt: 1 });
    for (const sale of legacySales) {
      counter += 1;
      const total = sale.totalAmount || 0;
      await Sale.updateOne({ _id: sale._id }, {
        $set: {
          saleNumber: counter,
          invoiceNumber: formatInvoiceNumber(counter),
          items: [{
            productId: sale.productId,
            productName: sale.productName || 'Product',
            quantity: sale.quantity || 1,
            unitPrice: sale.sellingPrice || 0,
            subtotal: total
          }],
          subtotal: total,
          discount: 0,
          tax: 0
        }
      });
      converted += 1;
    }

    await User.updateOne({ _id: userId }, { $max: { saleCounter: counter } });
  }

  return converted;
};

module.exports = migrateLegacySales;
