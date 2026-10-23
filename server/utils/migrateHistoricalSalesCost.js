const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { round2 } = require('./saleUtils');

/**
 * Reconstructs unitCost, totalCost, and costOfGoodsSold for existing sales
 * using historical product purchase records where reliable purchase prices exist.
 * If a product or cost is unrecoverable, flags hasIncompleteCost: true.
 */
module.exports = async function migrateHistoricalSalesCost() {
  try {
    const sales = await Sale.find({});
    if (!sales.length) return { updated: 0, incomplete: 0 };

    // Load all products to map purchase prices
    const products = await Product.find({});
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    let updatedCount = 0;
    let incompleteCount = 0;

    for (const sale of sales) {
      let isModified = false;
      let hasMissingCost = false;

      const items = Array.isArray(sale.items) && sale.items.length > 0 ? sale.items : [];
      let saleCogs = 0;

      for (const item of items) {
        // If cost is 0 or missing, attempt to reconstruct from product
        if (!item.unitCost || !item.totalCost) {
          const product = productMap.get(String(item.productId));
          if (product && typeof product.purchasePrice === 'number' && product.purchasePrice >= 0) {
            item.unitCost = round2(product.purchasePrice);
            item.totalCost = round2(item.quantity * item.unitCost);
            isModified = true;
          } else {
            hasMissingCost = true;
          }
        }
        saleCogs += Number(item.totalCost || 0);
      }

      // Check legacy single product fields if items was empty
      if (!items.length && (sale.productId || sale.productName)) {
        const product = productMap.get(String(sale.productId));
        if (product && typeof product.purchasePrice === 'number' && product.purchasePrice >= 0) {
          saleCogs = round2((sale.quantity || 1) * product.purchasePrice);
          isModified = true;
        } else {
          hasMissingCost = true;
        }
      }

      const calculatedCogs = round2(saleCogs);
      if (isModified || sale.costOfGoodsSold !== calculatedCogs || (hasMissingCost && !sale.hasIncompleteCost)) {
        sale.costOfGoodsSold = calculatedCogs;
        if (hasMissingCost) {
          sale.hasIncompleteCost = true;
          incompleteCount++;
        }
        await sale.save();
        updatedCount++;
      }
    }

    return { updated: updatedCount, incomplete: incompleteCount };
  } catch (err) {
    console.error('Error during sales cost migration:', err);
    return { updated: 0, incomplete: 0 };
  }
};
