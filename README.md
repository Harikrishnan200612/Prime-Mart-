# Prime Mart - Full-Stack Business Management System

[![GitHub Repository](https://img.shields.io/badge/GitHub-Prime%20Mart-black?logo=github)](https://github.com/Harikrishnan200612/Prime-Mart-)

Prime Mart is a full-stack business management system designed for small shops and businesses to manage sales, expenses, inventory, staff, and business analytics from one unified platform.

## 🎯 Features

### Dashboard & Analytics
- **Financial Summary Cards** - Real-time display of total sales, expenses, and profit/loss
- **Profit Margin Calculation** - Track profitability percentage
- **Daily Summary** - Quick overview of today's transactions
- **Advanced Reports** - Sales trends, expense analysis, profit charts with Recharts
- **Payment Method Analysis** - Pie chart showing cash, UPI, and card distribution
- **Top Products Report** - Best-selling products by quantity and revenue

### Sales Management
- Add, edit, delete sales transactions
- Track product, quantity, price, payment method
- Automatic inventory reduction when sale is recorded
- Search and filter by product, customer, or payment method
- Filter by date range
- Prevent selling unavailable items with stock validation
- Customer name tracking (optional)
- Sales notes and remarks

### Expense Management
- Record business expenses by category
- Pre-defined categories: Stock Purchase, Rent, Electricity, Water, Internet, Salary, Transportation, Maintenance, Marketing, Other
- Track payment method and amount
- Filter by category and date
- Search functionality
- Expense summary by category
- Large expense notifications (₹50,000+)

### Inventory Management
- Add, edit, delete products
- Product details: Name, SKU, Category, Purchase Price, Selling Price
- Stock tracking with minimum stock levels
- Stock status badges: In Stock, Low Stock, Out of Stock
- Increase/decrease stock with quantity input
- Low stock and out-of-stock notifications
- Inventory value calculation
- Search by product name or SKU
- Filter by category

### Staff Management
- Employee records with name, email, phone, role
- Roles: Manager, Cashier, Sales Staff, Delivery Staff, Other
- Monthly salary tracking
- Activate/Deactivate employees
- Filter by role and status
- Search by name, email, or phone
- Total salary expense calculation

### Authentication & Security
- User registration with business details
- Login with JWT authentication
- Secure password hashing with bcrypt
- Protected routes (unauthorized access redirects to login)
- Session persistence
- Logout functionality
- User-specific data isolation

### Notifications
- Low stock alerts with remaining quantity
- Out of stock notifications
- Large expense alerts (₹50,000+)
- Real-time notification system

### User Interface
- Responsive design (mobile, tablet, desktop)
- Modern, clean UI suitable for business owners
- Sidebar navigation on desktop
- Bottom mobile navigation on small screens
- Dark theme sidebar with light content area
- Loading states and spinners
- Empty states for no data
- Confirmation dialogs before deletion
- Toast-style alerts for errors/success
- Modal forms for data entry

## 📋 Tech Stack

### Frontend
- **React.js 18** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Recharts** - Interactive charts and graphs
- **Vite** - Fast build tool
- **CSS3** - Styling with CSS Grid and Flexbox

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **Cors** - Cross-origin resource sharing

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud - MongoDB Atlas recommended)

### Installation

1. **Clone or Extract the Project**
   ```bash
   cd "c:\FSD project"
   ```

2. **Install All Dependencies**
   ```bash
   npm run install-all
   ```
   This installs dependencies for root, server, and client.

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   MONGODB_URI=mongodb://localhost:27017/smartbiz
   JWT_SECRET=your_secret_key_here_change_in_production
   PORT=5000
   NODE_ENV=development
   VITE_API_URL=http://localhost:5000
   ```

4. **MongoDB Setup**
   
   **Option A: Local MongoDB**
   ```bash
   mongod
   ```
   
   **Option B: MongoDB Atlas (Cloud)**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create a cluster and database
   - Replace `MONGODB_URI` in `.env` with your connection string

5. **Seed Demo Data (Optional)**
   ```bash
   cd server
   npm run seed
   cd ..
   ```
   
   This creates a demo account:
   - Email: `admin@primemart.com`
   - Password: Set locally through `DEMO_PASSWORD` (never commit credentials)

### Running the Application

**Development Mode (Both Frontend & Backend)**
```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:5000`
- Frontend on `http://localhost:5173`

**Or Run Separately:**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

**Production Build:**
```bash
cd client
npm run build
```

## 📱 Project Structure

```
smartbiz-manager/
│
├── client/                          # Frontend (React.js)
│   ├── src/
│   │   ├── components/             # Reusable components
│   │   ├── pages/                  # Page components (Dashboard, Sales, etc.)
│   │   ├── layouts/                # Layout components (Layout with sidebar)
│   │   ├── services/               # API service files
│   │   ├── context/                # React Context (Auth)
│   │   ├── App.jsx                 # Main app component
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Global styles
│   ├── index.html                  # HTML template
│   ├── vite.config.js              # Vite configuration
│   └── package.json
│
├── server/                          # Backend (Node.js/Express)
│   ├── models/                     # MongoDB Mongoose models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Sale.js
│   │   ├── Expense.js
│   │   ├── Staff.js
│   │   └── Notification.js
│   ├── routes/                     # API routes
│   │   ├── auth.js                # Authentication endpoints
│   │   ├── dashboard.js           # Dashboard summary
│   │   ├── sales.js               # Sales CRUD endpoints
│   │   ├── expenses.js            # Expenses CRUD endpoints
│   │   ├── products.js            # Inventory CRUD endpoints
│   │   ├── staff.js               # Staff CRUD endpoints
│   │   └── reports.js             # Analytics endpoints
│   ├── middleware/                # Custom middleware
│   │   └── auth.js               # JWT authentication
│   ├── seed/                     # Demo data seeding
│   │   └── seedData.js
│   ├── server.js                 # Main server file
│   └── package.json
│
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
├── package.json                   # Root package.json
└── README.md                      # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new business account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard` - Get financial summary

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Add new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/increase-stock` - Increase inventory
- `POST /api/products/:id/decrease-stock` - Decrease inventory

### Sales
- `GET /api/sales` - Get all sales (with search/filter)
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales` - Create new sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Expenses
- `GET /api/expenses` - Get all expenses (with search/filter)
- `GET /api/expenses/:id` - Get expense details
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Staff
- `GET /api/staff` - Get all staff (with search/filter)
- `GET /api/staff/:id` - Get staff details
- `POST /api/staff` - Add new employee
- `PUT /api/staff/:id` - Update employee
- `DELETE /api/staff/:id` - Delete employee

### Reports & Analytics
- `GET /api/reports/sales` - Sales trend data
- `GET /api/reports/expenses` - Expenses by category
- `GET /api/reports/profit` - Profit analysis
- `GET /api/reports/payment-methods` - Payment distribution
- `GET /api/reports/top-products` - Best-selling products

## 📊 Complete End-to-End Flow

### Creating Your First Sale

1. **Register/Login**
   - Go to `http://localhost:5173/register`
   - Fill in business details or use demo credentials

2. **Add Products**
   - Navigate to **Inventory** (📦)
   - Click **+ Add Product**
   - Enter product details (name, SKU, prices, stock)

3. **Record a Sale**
   - Go to **Sales** (💰)
   - Click **+ Add Sale**
   - Select product, enter quantity
   - Choose payment method
   - Stock automatically reduces

4. **Track Finances**
   - **Dashboard** shows updated sales total
   - **Reports** display sales charts and trends
   - Low stock products appear on dashboard

5. **Record Expenses**
   - Go to **Expenses** (💸)
   - Add expense with category and amount
   - Dashboard updates profit/loss

6. **Manage Staff**
   - Go to **Staff** (👥)
   - Add employees with salaries
   - Track active vs inactive staff
   - View total monthly salary expense

7. **View Analytics**
   - Go to **Reports** (📈)
   - Select time period
   - View sales trends, expense breakdown
   - Check top-selling products

## 🧪 Testing the Application

### Test Scenarios

1. **Registration & Login**
   - ✓ Register new business
   - ✓ Login with credentials
   - ✓ Session persists on refresh
   - ✓ Logout clears session

2. **Inventory**
   - ✓ Add product with all details
   - ✓ Edit product information
   - ✓ Increase/decrease stock
   - ✓ Low stock notifications appear
   - ✓ Prevent selling more than available

3. **Sales**
   - ✓ Record sale successfully
   - ✓ Inventory reduces automatically
   - ✓ Profit/loss updates on dashboard
   - ✓ Search and filter sales
   - ✓ Edit and delete sales

4. **Expenses**
   - ✓ Record expense by category
   - ✓ Total expenses update
   - ✓ Filter by category
   - ✓ Large expenses trigger notification

5. **Reports**
   - ✓ Charts render correctly
   - ✓ Period filters work
   - ✓ Top products display
   - ✓ Payment methods pie chart shows

6. **Mobile Responsiveness**
   - ✓ Sidebar converts to mobile nav
   - ✓ Tables become scrollable
   - ✓ Forms fit small screens
   - ✓ Bottom navigation appears
   - ✓ No horizontal scroll

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB Connection Error
- Check if MongoDB is running: `mongod`
- Verify MongoDB URI in `.env`
- Test connection with MongoDB Compass

### API Not Responding
- Ensure backend is running: `npm run dev` (server folder)
- Check server console for errors
- Verify API URL in frontend `.env`

### Frontend Not Loading
- Clear browser cache
- Try: `Ctrl+Shift+Delete` (Chrome DevTools)
- Restart dev server

## 📝 Demo Account

**Pre-configured Demo Account (if seed data was run):**
- Email: `admin@primemart.com`
- Password: Set locally through `DEMO_PASSWORD` (never commit credentials)
- Business: Prime Mart

Includes sample products, sales, expenses, and staff for testing.

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Protected API routes require authentication
- CORS configuration to prevent unauthorized access
- Environment variables for sensitive data
- User data isolation (users only see their business data)
- Input validation on backend
- Error messages don't expose system details

## 🎨 UI/UX Highlights

- Clean, modern dashboard interface
- Green profit display (🟢 + color)
- Red loss display (🔴 + color)
- Yellow low-stock warnings
- Color-coded badges for status
- Responsive grid layouts
- Smooth animations and transitions
- Touch-friendly buttons on mobile
- Empty states with helpful messages
- Loading spinners for async operations
- Confirmation dialogs before deletion

## 📈 Future Improvements

- Invoice PDF generation
- Email notifications
- Multi-currency support
- Advanced user roles & permissions
- Customer database with purchase history
- Supplier management
- Barcode scanning
- Mobile app
- Data export (CSV, Excel, PDF)
- Backup & recovery
- Analytics dashboards with KPIs
- Multiple business account support
- Integration with payment gateways

## 📞 Support & Issues

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Check server logs
4. Verify all environment variables
5. Ensure MongoDB is running

## 📄 License

This project is provided as-is for educational and business use.

## 🙏 Credits

Built with modern web technologies:
- React.js - UI framework
- Express.js - Backend framework
- MongoDB - Database
- Recharts - Data visualization

---

**Prime Mart v1.0.0**  
A complete small business management solution.

For detailed API documentation, check individual route files in `/server/routes/`.

Happy managing! 🚀
