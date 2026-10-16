const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification');
const {
  HttpError,
  round2,
  formatInvoiceNumber,
  escapeRegex,
  getSaleItems,
  serializeSale,
  parseSaleInput,
  computeTotals,
  insufficientStockError,
  runAtomic
} = require('../utils/saleUtils');

const sessionOpts = (ctx) => (ctx.session ? { session: ctx.session } : {});

const sendError = (res, err, fallbackMessage) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
      ...(err.details ? { details: err.details } : {})
    });
  }
  console.error(fallbackMessage, err);
  return res.status(500).json({ message: fallbackMessage });
};

const loadProducts = async (userId, ids, ctx) => {
  const products = await Product.find({ _id: { $in: ids }, userId }).session(ctx.session);
  return new Map(products.map((product) => [String(product._id), product]));
};

// Moves stock for one product. delta < 0 sells stock (guarded so it can never go
// below zero, even with two sales happening at once); delta > 0 puts stock back.
// Returns false when there is not enough stock.
const adjustStock = async (userId, productId, delta, ctx) => {
  if (delta === 0) return true;
  const now = new Date();

  if (delta < 0) {
    const need = -delta;
    const result = await Product.updateOne(
      { _id: productId, userId, stock: { $gte: need } },
      { $inc: { stock: -need }, $set: { updatedAt: now } },
      sessionOpts(ctx)
    );
    if (result.matchedCount !== 1) return false;
  } else {
    await Product.updateOne(
      { _id: productId, userId },
      { $inc: { stock: delta }, $set: { updatedAt: now } },
      sessionOpts(ctx)
    );
  }

  ctx.undo.push(() => Product.updateOne({ _id: productId, userId }, { $inc: { stock: -delta } }));
  return true;
};

const shortageFor = async (userId, productId, name, requested, ctx, extraAvailable = 0) => {
  const fresh = await Product.findOne({ _id: productId, userId }).session(ctx.session);
  return { productId: String(productId), productName: name, available: (fresh ? fresh.stock : 0) + extraAvailable, requested };
};

// Low / out-of-stock notifications after a sale has been committed
const notifyStockLevels = async (userId, productIds) => {
  try {
    const products = await Product.find({ _id: { $in: productIds }, userId });
    for (const product of products) {
      if (product.stock <= 0) {
        await new Notification({
          userId,
          type: 'out-of-stock',
          title: '🔴 Out of Stock',
          message: `${product.name} is now out of stock.`,
          related: 'product',
          relatedId: product._id
        }).save();
      } else if (product.stock <= product.minimumStock) {
        await new Notification({
          userId,
          type: 'low-stock',
          title: '⚠️ Low Stock',
          message: `${product.name} has only ${product.stock} units remaining.`,
          related: 'product',
          relatedId: product._id
        }).save();
      }
    }
  } catch (err) {
    console.error('Stock notification error:', err);
  }
};

// ---------------------------------------------------------------------------
// List sales
// ---------------------------------------------------------------------------
router.get('/', auth, async (req, res) => {
  try {
    const { search, paymentMethod, startDate, endDate } = req.query;
    const query = { userId: req.userId };

    if (search) {
      const pattern = { $regex: escapeRegex(search), $options: 'i' };
      query.$or = [
        { 'items.productName': pattern },
        { productName: pattern }, // legacy single-product sales
        { customerName: pattern },
        { invoiceNumber: pattern }
      ];
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
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

    const sales = await Sale.find(query).sort({ date: -1, createdAt: -1 });
    res.json(sales.map(serializeSale));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sales' });
  }
});

// Distinct customer names (for the customer picker on the sales form)
router.get('/customers', auth, async (req, res) => {
  try {
    const names = await Sale.distinct('customerName', { userId: req.userId });
    res.json(names.filter(Boolean).sort((a, b) => a.localeCompare(b)));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// ---------------------------------------------------------------------------
// Get single sale (complete sale / invoice details)
// ---------------------------------------------------------------------------
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, userId: req.userId });
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(serializeSale(sale));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sale' });
  }
});

// ---------------------------------------------------------------------------
// Create sale: one customer, many products, one bill
// ---------------------------------------------------------------------------
router.post('/', auth, async (req, res) => {
  try {
    const input = parseSaleInput(req.body);

    const sale = await runAtomic(async (ctx) => {
      const productMap = await loadProducts(req.userId, input.items.map((i) => i.productId), ctx);

      // 1. Every product must exist, prices come from the database
      const lines = input.items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) throw new HttpError(404, 'One of the selected products no longer exists.');
        const unitPrice = round2(product.sellingPrice);
        return {
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          subtotal: round2(item.quantity * unitPrice),
          available: product.stock
        };
      });

      // 2. Every product must have enough stock (report all shortages at once)
      const shortages = lines
        .filter((line) => line.available < line.quantity)
        .map((line) => ({
          productId: String(line.productId),
          productName: line.productName,
          available: line.available,
          requested: line.quantity
        }));
      if (shortages.length) throw insufficientStockError(shortages);

      // 3. Totals are calculated here, never taken from the client
      const { subtotal, totalAmount } = computeTotals(lines, input.discount, input.tax);

      // 4. Reduce inventory for every item (guarded against concurrent sales)
      for (const line of lines) {
        const ok = await adjustStock(req.userId, line.productId, -line.quantity, ctx);
        if (!ok) {
          throw insufficientStockError([
            await shortageFor(req.userId, line.productId, line.productName, line.quantity, ctx)
          ]);
        }
      }

      // 5. Next bill number for this business
      const owner = await User.findOneAndUpdate(
        { _id: req.userId },
        { $inc: { saleCounter: 1 } },
        { new: true, ...sessionOpts(ctx) }
      );
      if (!owner) throw new HttpError(401, 'User not found');

      // 6. Save ONE sale containing all items
      const [created] = await Sale.create([{
        userId: req.userId,
        saleNumber: owner.saleCounter,
        invoiceNumber: formatInvoiceNumber(owner.saleCounter),
        customerName: input.customerName,
        items: lines.map(({ available, ...line }) => line),
        subtotal,
        discount: input.discount,
        tax: input.tax,
        totalAmount,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        ...(input.date ? { date: input.date } : {})
      }], sessionOpts(ctx));

      ctx.undo.push(() => Sale.deleteOne({ _id: created._id }));
      return created;
    });

    await notifyStockLevels(req.userId, sale.items.map((item) => item.productId));
    res.status(201).json(serializeSale(sale));
  } catch (err) {
    sendError(res, err, 'Failed to add sale');
  }
});

// ---------------------------------------------------------------------------
// Edit sale: add / remove products, change quantities, recalculate totals and
// correct inventory using only the DIFFERENCE from what was already deducted
// ---------------------------------------------------------------------------
router.put('/:id', auth, async (req, res) => {
  try {
    const input = parseSaleInput(req.body);

    const sale = await runAtomic(async (ctx) => {
      const existing = await Sale.findOne({ _id: req.params.id, userId: req.userId }).session(ctx.session);
      if (!existing) throw new HttpError(404, 'Sale not found');

      const oldItems = getSaleItems(existing);
      const oldByProduct = new Map(oldItems.map((item) => [String(item.productId), item]));

      const ids = new Set([...oldByProduct.keys(), ...input.items.map((i) => i.productId)]);
      const productMap = await loadProducts(req.userId, [...ids], ctx);

      // Build the new lines. Items already on the bill keep the price they were
      // sold at; products added during the edit use the current database price.
      const lines = input.items.map((item) => {
        const old = oldByProduct.get(item.productId);
        const product = productMap.get(item.productId);

        if (!product) {
          if (old && old.quantity === item.quantity) return { ...old, missing: true };
          throw new HttpError(404, `${old ? old.productName : 'A selected product'} no longer exists in inventory.`);
        }

        const unitPrice = old ? round2(old.unitPrice) : round2(product.sellingPrice);
        return {
          productId: product._id,
          productName: old ? old.productName : product.name,
          quantity: item.quantity,
          unitPrice,
          subtotal: round2(item.quantity * unitPrice)
        };
      });

      // Net stock change per product = what was deducted before - what is needed now
      const deltas = new Map();
      oldItems.forEach((item) => deltas.set(String(item.productId), item.quantity));
      lines.forEach((line) => {
        const key = String(line.productId);
        deltas.set(key, (deltas.get(key) || 0) - line.quantity);
      });

      // Check every increase against stock first so the error lists every problem
      const shortages = [];
      for (const line of lines) {
        if (line.missing) continue;
        const key = String(line.productId);
        const delta = deltas.get(key); // negative => needs extra stock
        const product = productMap.get(key);
        if (delta < 0 && product.stock < -delta) {
          const alreadyOnBill = oldByProduct.get(key)?.quantity || 0;
          shortages.push({
            productId: key,
            productName: line.productName,
            available: product.stock + alreadyOnBill,
            requested: line.quantity
          });
        }
      }
      if (shortages.length) throw insufficientStockError(shortages);

      const { subtotal, totalAmount } = computeTotals(lines, input.discount, input.tax);

      // Apply only the differences (decreases first, so failures happen before any restore)
      const ordered = [...deltas.entries()].sort((a, b) => a[1] - b[1]);
      for (const [productId, delta] of ordered) {
        if (!productMap.has(productId)) continue; // product was deleted from inventory
        const ok = await adjustStock(req.userId, productId, delta, ctx);
        if (!ok) {
          const line = lines.find((l) => String(l.productId) === productId);
          const alreadyOnBill = oldByProduct.get(productId)?.quantity || 0;
          throw insufficientStockError([
            await shortageFor(req.userId, productId, line?.productName || 'product', line?.quantity || 0, ctx, alreadyOnBill)
          ]);
        }
      }

      // Convert old single-product sales to the new shape on first edit
      ['productId', 'productName', 'quantity', 'sellingPrice'].forEach((field) => existing.set(field, undefined));

      existing.items = lines.map(({ missing, ...line }) => line);
      existing.subtotal = subtotal;
      existing.discount = input.discount;
      existing.tax = input.tax;
      existing.totalAmount = totalAmount;
      existing.customerName = input.customerName;
      existing.paymentMethod = input.paymentMethod;
      existing.notes = input.notes;
      if (input.date) existing.date = input.date;

      await existing.save(sessionOpts(ctx));
      return existing;
    });

    await notifyStockLevels(req.userId, sale.items.map((item) => item.productId));
    res.json(serializeSale(sale));
  } catch (err) {
    sendError(res, err, 'Failed to update sale');
  }
});

// ---------------------------------------------------------------------------
// Delete sale: put every product's stock back, then remove the sale
// ---------------------------------------------------------------------------
router.delete('/:id', auth, async (req, res) => {
  try {
    await runAtomic(async (ctx) => {
      const sale = await Sale.findOne({ _id: req.params.id, userId: req.userId }).session(ctx.session);
      if (!sale) throw new HttpError(404, 'Sale not found');

      const snapshot = sale.toObject();
      for (const item of getSaleItems(sale)) {
        await adjustStock(req.userId, item.productId, item.quantity, ctx); // no-op if product was deleted
      }

      await Sale.deleteOne({ _id: sale._id }, sessionOpts(ctx));
      ctx.undo.push(() => Sale.create(snapshot));
    });

    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
    sendError(res, err, 'Failed to delete sale');
  }
});

module.exports = router;
