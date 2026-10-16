const mongoose = require('mongoose');

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card'];

class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const formatInvoiceNumber = (n) => `SALE-${String(n).padStart(3, '0')}`;

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------------------------------------------------------------------------
// Reading sales (works for new multi-product sales AND old single-product ones)
// ---------------------------------------------------------------------------

const getSaleItems = (sale) => {
  if (Array.isArray(sale.items) && sale.items.length > 0) {
    return sale.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal
    }));
  }
  if (sale.productId || sale.productName) {
    return [{
      productId: sale.productId,
      productName: sale.productName,
      quantity: sale.quantity || 0,
      unitPrice: sale.sellingPrice || 0,
      subtotal: sale.totalAmount || 0
    }];
  }
  return [];
};

// Plain-object version of a sale that the frontend can rely on.
const serializeSale = (sale) => {
  const obj = typeof sale.toObject === 'function' ? sale.toObject() : { ...sale };
  const items = getSaleItems(obj);
  const itemsTotal = round2(items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0));

  const out = {
    ...obj,
    items,
    subtotal: obj.subtotal ?? (itemsTotal || obj.totalAmount || 0),
    discount: obj.discount || 0,
    tax: obj.tax || 0,
    invoiceNumber: obj.invoiceNumber || `SALE-${String(obj._id).slice(-6).toUpperCase()}`,
    itemCount: items.length,
    totalUnits: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  };

  delete out.productId;
  delete out.productName;
  delete out.quantity;
  delete out.sellingPrice;
  delete out.__v;
  return out;
};

// Aggregation stage: guarantees every sale has an `items` array, even legacy ones.
// Use before `$unwind: '$items'` or when summing item quantities.
const normalizeItemsStage = {
  $addFields: {
    items: {
      $cond: [
        { $gt: [{ $size: { $ifNull: ['$items', []] } }, 0] },
        '$items',
        {
          $cond: [
            { $ifNull: ['$productId', false] },
            [{
              productId: '$productId',
              productName: '$productName',
              quantity: { $ifNull: ['$quantity', 0] },
              unitPrice: { $ifNull: ['$sellingPrice', 0] },
              subtotal: { $ifNull: ['$totalAmount', 0] }
            }],
            []
          ]
        }
      ]
    }
  }
};

// ---------------------------------------------------------------------------
// Validating request bodies
// ---------------------------------------------------------------------------

const parseAmount = (value, label) => {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new HttpError(400, `${label} must be a number that is 0 or more.`);
  }
  return round2(number);
};

const parseSaleDate = (value) => {
  if (!value) return undefined;
  const text = String(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  let date;
  if (match) {
    // Keep the picked calendar day but use the current clock time on it
    date = new Date();
    date.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  } else {
    date = new Date(text);
  }
  if (Number.isNaN(date.getTime())) throw new HttpError(400, 'Sale date is invalid.');
  return date;
};

// Validates the shape of the request and merges duplicate products.
// It never reads prices or totals from the client.
const parseSaleInput = (body = {}) => {
  let rawItems = body.items;

  // Backwards compatibility: old clients sent a single product at top level
  if (!Array.isArray(rawItems) && body.productId) {
    rawItems = [{ productId: body.productId, quantity: body.quantity }];
  }

  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  if (!customerName) throw new HttpError(400, 'Customer is required.');

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new HttpError(400, 'At least one product is required.');
  }

  const merged = new Map();
  rawItems.forEach((raw, index) => {
    const productId = raw && (raw.productId?._id || raw.productId);
    if (!productId || !mongoose.isValidObjectId(productId)) {
      throw new HttpError(400, `Item ${index + 1}: a valid product is required.`);
    }
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpError(400, `Item ${index + 1}: quantity must be a whole number greater than 0.`);
    }
    const key = String(productId);
    merged.set(key, (merged.get(key) || 0) + quantity);
  });

  const paymentMethod = body.paymentMethod;
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw new HttpError(400, 'Payment method must be Cash, UPI or Card.');
  }

  return {
    customerName,
    items: [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity })),
    discount: parseAmount(body.discount, 'Discount'),
    tax: parseAmount(body.tax, 'Tax'),
    paymentMethod,
    notes: typeof body.notes === 'string' ? body.notes : '',
    date: parseSaleDate(body.date)
  };
};

const computeTotals = (lines, discount, tax) => {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.subtotal, 0));
  if (discount > subtotal) {
    throw new HttpError(400, `Discount (${discount}) cannot be more than the subtotal (${subtotal}).`);
  }
  return { subtotal, totalAmount: round2(subtotal - discount + tax) };
};

const insufficientStockError = (shortages) => {
  const message = shortages
    .map((s) => `Insufficient stock for ${s.productName}.\nAvailable: ${s.available}\nRequested: ${s.requested}`)
    .join('\n\n');
  return new HttpError(400, message, { code: 'INSUFFICIENT_STOCK', details: shortages });
};

// ---------------------------------------------------------------------------
// All-or-nothing execution
// ---------------------------------------------------------------------------

let transactionsSupported = null; // unknown until first checked

// Transactions only exist on replica-set members and mongos routers (e.g. MongoDB Atlas).
// A plain standalone mongod - the usual local setup - cannot run them. Asking the
// server up front avoids ever starting a "transaction" that would not be honoured.
const detectTransactionSupport = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    let info;
    try {
      info = await admin.command({ hello: 1 });
    } catch (err) {
      info = await admin.command({ isMaster: 1 }); // servers older than 4.4.2
    }
    return Boolean(info.setName) || info.msg === 'isdbgrid';
  } catch (err) {
    return false;
  }
};

const isTransactionUnsupported = (err) => Boolean(err) && (
  err.code === 20 ||
  err.codeName === 'IllegalOperation' ||
  /Transaction numbers are only allowed|does not support transactions|Transactions are not supported|replica set|unknown field "?autocommit"?/i.test(err.message || '')
);

/**
 * Runs `work(ctx)` so that either every change is saved or none are.
 *
 *  - On MongoDB deployments that support transactions (Atlas, replica sets)
 *    a real multi-document transaction is used: `ctx.session` is set and every
 *    query inside `work` must pass it.
 *  - On a standalone mongod (typical local setup) transactions do not exist, so
 *    `ctx.session` is null and every step registers a compensating action in
 *    `ctx.undo`; if anything fails those actions are replayed in reverse order.
 */
const runAtomic = async (work) => {
  if (transactionsSupported === null) transactionsSupported = await detectTransactionSupport();

  if (transactionsSupported) {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await work({ session, undo: [] });
      });
      transactionsSupported = true;
      return result;
    } catch (err) {
      if (!isTransactionUnsupported(err)) throw err;
      transactionsSupported = false;
      console.warn('MongoDB transactions are not available on this server; using compensating rollback instead.');
    } finally {
      await session.endSession();
    }
  }

  const ctx = { session: null, undo: [] };
  try {
    return await work(ctx);
  } catch (err) {
    for (const undo of ctx.undo.reverse()) {
      try {
        await undo();
      } catch (undoErr) {
        console.error('Rollback step failed:', undoErr);
      }
    }
    throw err;
  }
};

module.exports = {
  PAYMENT_METHODS,
  HttpError,
  round2,
  formatInvoiceNumber,
  escapeRegex,
  getSaleItems,
  serializeSale,
  normalizeItemsStage,
  parseSaleInput,
  computeTotals,
  insufficientStockError,
  runAtomic
};
