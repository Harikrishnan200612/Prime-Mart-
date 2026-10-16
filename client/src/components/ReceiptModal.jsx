import React from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import LogoMark from './LogoMark';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/**
 * One invoice per sale: every product on the sale is a line item on this single
 * document. The same view is used for "sale details" and for printing.
 */
const ReceiptModal = ({ sale, onClose }) => {
  const { user } = useAuth();

  if (!sale) return null;

  const items = Array.isArray(sale.items) ? sale.items : [];
  const subtotal = sale.subtotal ?? items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const discount = Number(sale.discount || 0);
  const tax = Number(sale.tax || 0);
  const totalUnits = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  // `date` is the business/transaction date the user picked (may be backdated, no time component).
  // `createdAt` is the real timestamp the record was saved, which is the best available clock time.
  const businessDate = new Date(sale.date || sale.createdAt || Date.now());
  const timeSource = new Date(sale.createdAt || sale.date || Date.now());
  const dateLabel = Number.isNaN(businessDate.getTime())
    ? '—'
    : businessDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeLabel = Number.isNaN(timeSource.getTime())
    ? '—'
    : timeSource.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const invoiceNo = sale.invoiceNumber || String(sale._id || '').slice(-8).toUpperCase() || 'N/A';

  const handlePrint = () => window.print();

  const modalContent = (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal receipt-modal" role="dialog" aria-modal="true">
        <div className="modal-header no-print">
          <div><span className="eyebrow">INVOICE</span><h2>Sale {invoiceNo}</h2></div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="receipt-print-area">
            <div className="receipt-paper">
              <div className="receipt-brand">
                <LogoMark variant="receipt-logo" />
                <div>
                  <h3>{user?.businessName || 'Prime Mart'}</h3>
                  <p>{user?.email || ''}{user?.phone ? ` · ${user.phone}` : ''}</p>
                </div>
              </div>

              <div className="receipt-meta">
                <div><span>Invoice No.</span><strong>{invoiceNo}</strong></div>
                <div><span>Date</span><strong>{dateLabel}</strong></div>
                <div><span>Time</span><strong>{timeLabel}</strong></div>
                <div><span>Payment</span><strong>{sale.paymentMethod}</strong></div>
              </div>

              <div className="receipt-customer">
                <span>Billed to</span>
                <strong>{sale.customerName || 'Walk-in Customer'}</strong>
              </div>

              <table className="receipt-items">
                <thead>
                  <tr><th>#</th><th>Product</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Amount</th></tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${item.productId}-${index}`}>
                      <td>{index + 1}</td>
                      <td>{item.productName}</td>
                      <td className="num">{item.quantity}</td>
                      <td className="num">{money(item.unitPrice)}</td>
                      <td className="num">{money(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="receipt-count">{items.length} item{items.length === 1 ? '' : 's'} · {totalUnits} unit{totalUnits === 1 ? '' : 's'}</div>

              <div className="receipt-totals">
                <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                <div><span>Discount</span><strong>{discount ? `− ${money(discount)}` : money(0)}</strong></div>
                <div><span>Tax</span><strong>{money(tax)}</strong></div>
                <div className="receipt-grand-total"><span>Grand total</span><strong>{money(sale.totalAmount)}</strong></div>
                <div><span>Paid by</span><strong>{sale.paymentMethod}</strong></div>
              </div>

              {sale.notes && <p className="receipt-notes">Note: {sale.notes}</p>}

              <p className="receipt-footer">Thank you for shopping with us!</p>
            </div>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>🖨 Print / Save as PDF</button>
        </div>
      </div>
    </div>
  );

  // Render outside the page's own DOM tree (into #print-root, a sibling of #root in index.html).
  // This means printing can hide the entire app (#root) and print only this portal's content,
  // instead of relying on fragile visibility/position tricks that break on tall pages.
  const portalTarget = typeof document !== 'undefined' ? document.getElementById('print-root') : null;
  return portalTarget ? createPortal(modalContent, portalTarget) : modalContent;
};

export default ReceiptModal;
