# Multi-product sales – what changed

## Backend (server/)
| File | Change |
|---|---|
| models/Sale.js | `items[]` (productId, productName, quantity, unitPrice, subtotal) + subtotal, discount, tax, totalAmount, saleNumber, invoiceNumber. Old single-product fields kept as optional legacy fields. |
| models/User.js | `saleCounter` – atomic per-business counter for SALE-001, SALE-002… |
| utils/saleUtils.js (new) | Validation, duplicate-product merging, totals, all-or-nothing runner (transaction or rollback), legacy-sale reader, aggregation helper. |
| utils/migrateLegacySales.js (new) | Idempotent conversion of old one-product sales to the new shape (runs on server start). |
| routes/sales.js | POST/PUT/DELETE rewritten for many products; GET list/search covers items and invoice no.; new GET /sales/customers. |
| routes/dashboard.js | Adds salesCount, unitsSold, productLinesSold. |
| routes/reports.js | Sales-by-date adds units; top products unwinds items; payment methods count sales. |
| server.js | Runs the legacy migration after connecting. |
| seed/seedData.js | Demo sales are now multi-product. |

## Frontend (client/src/)
| File | Change |
|---|---|
| pages/Sales.jsx | Cart-style form, merge duplicates, editable qty, remove, discount/tax, history with Sale ID / Products / Items / Units, click row = details, edit, Excel import/export grouped by Sale ID. |
| components/ReceiptModal.jsx | One invoice with all line items, subtotal, discount, tax, grand total, payment method. |
| pages/Pages.css | Styles for the above (dark theme included). |
| services/api.js | `saleService.getCustomers`. |
| pages/Dashboard.jsx, pages/Reports.jsx | Show sales vs units; "Sales" column in top products. |
| context/SettingsContext.jsx | New default logo reaches browsers that saved the old one; uploaded logos are kept. |
| assets/prime-mart-logo.png, public/favicon.svg, index.html | New logo + favicon. |
