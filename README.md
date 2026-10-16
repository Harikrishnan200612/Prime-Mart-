# Prime Mart — Business Management System

> **Full-stack business management system** with sales tracking, inventory management, expense records, staff management, and reporting.

---

## 🔗 Links

| | URL |
|---|---|
| 🌐 **Live Application** | [https://harikrishnan200612.github.io/Prime-Mart-/](https://harikrishnan200612.github.io/Prime-Mart-/) |
| 📦 **Source Code** | [https://github.com/Harikrishnan200612/Prime-Mart-](https://github.com/Harikrishnan200612/Prime-Mart-) |

> **Note:** The live application requires the backend API to be deployed separately (GitHub Pages only serves the static frontend). See the [Backend Deployment](#backend-deployment) section below.

---

## 📋 Features

- 🔐 **Authentication** — Register and login with JWT-based auth
- 📊 **Dashboard** — Business KPIs and summary charts
- 🛒 **Sales** — Record multi-product sales with receipt generation
- 📦 **Inventory** — Product management with stock tracking
- 💸 **Expenses** — Track business expenses by category
- 👥 **Staff** — Employee management
- 📈 **Reports** — Sales, expenses, and profit reports with Excel export
- ⚙️ **Settings** — Business customisation options

---

## 🏗️ Project Structure

```
Prime-Mart-/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── pages/        # Route-level page components
│   │   ├── components/   # Shared UI components
│   │   ├── context/      # React contexts (Auth, Settings)
│   │   ├── services/     # Axios API service layer
│   │   └── layouts/      # App shell layout
│   ├── public/           # Static assets
│   └── vite.config.js    # Vite config (base: /Prime-Mart-/)
├── server/               # Node.js + Express backend
│   ├── models/           # Mongoose models
│   ├── routes/           # API route handlers
│   ├── middleware/        # Auth middleware
│   └── server.js         # Entry point
└── .github/workflows/    # GitHub Actions CI/CD
    └── deploy.yml        # Deploys client/ to GitHub Pages
```

---

## 🖥️ Local Development

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com/))

### 1. Clone the repository

```bash
git clone https://github.com/Harikrishnan200612/Prime-Mart-.git
cd Prime-Mart-
```

### 2. Configure environment variables

**Backend** — create `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/primemart
JWT_SECRET=your_secure_jwt_secret_here
PORT=5000
NODE_ENV=development
FRONTEND_URLS=http://localhost:5173,https://harikrishnan200612.github.io
```

**Frontend** — create `client/.env.local`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Install dependencies

```bash
# Install root, server, and client dependencies
npm run install-all
```

Or install individually:

```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 4. Start development servers

```bash
# Start both backend (port 5000) and frontend (port 5173) concurrently
npm run dev
```

Or run separately:

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

### 5. Open the application

Visit **http://localhost:5173** in your browser.

---

## 🔨 Build (Frontend)

```bash
cd client
npm run build
# Output → client/dist/
```

The build uses base path `/Prime-Mart-/` matching the GitHub Pages URL.

---

## ☁️ Deployment

### Frontend — GitHub Pages (Automatic)

The frontend is automatically deployed to GitHub Pages via GitHub Actions on every push to `main`.

**To enable GitHub Pages:**

1. Go to your repository on GitHub
2. Click **Settings → Pages**
3. Under **Build and deployment**, select **GitHub Actions**
4. Click **Save**

The workflow (`.github/workflows/deploy.yml`) will:
- Install frontend dependencies with `npm ci`
- Build the Vite app with `npm run build`
- Deploy `client/dist/` to GitHub Pages

**Live URL:** https://harikrishnan200612.github.io/Prime-Mart-/

---

### Backend Deployment

GitHub Pages **only serves static files** — it cannot run the Node.js backend. You must deploy the backend separately.

#### Option A: Render (Free Tier — Recommended)

1. Sign up at [render.com](https://render.com/)
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
5. Add environment variables in the Render dashboard:
   ```
   MONGODB_URI      = mongodb+srv://<user>:<pass>@cluster.mongodb.net/primemart
   JWT_SECRET       = your_secure_random_secret
   NODE_ENV         = production
   FRONTEND_URLS    = https://harikrishnan200612.github.io
   ```
6. Deploy — Render will give you a URL like `https://prime-mart-api.onrender.com`

#### Option B: Railway

1. Sign up at [railway.app](https://railway.app/)
2. Create a new project → Deploy from GitHub repo
3. Set the service root directory to `server/`
4. Add the same environment variables as above
5. Railway will give you a public URL

---

### Connect the Deployed Backend to the Frontend

After deploying the backend, set the `VITE_API_URL` GitHub Actions variable so the frontend build knows where the API lives:

1. Go to your repository → **Settings → Secrets and variables → Actions**
2. Click the **Variables** tab
3. Click **New repository variable**
4. Name: `VITE_API_URL`
5. Value: `https://your-backend-url.onrender.com` *(no trailing slash)*
6. Click **Add variable**
7. Re-run the GitHub Actions workflow (or push a new commit to `main`)

The frontend will now build with the correct API URL and login/authentication will work on the live site.

---

## 🌱 Seed Data (Optional)

To populate the database with sample data for testing:

```bash
cd server
node seed/seedData.js
```

---

## 🔒 Environment Variables Reference

### Backend (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing JWTs | `a-long-random-string` |
| `PORT` | Port the server listens on | `5000` |
| `NODE_ENV` | Runtime environment | `production` |
| `FRONTEND_URLS` | Comma-separated allowed CORS origins | `https://harikrishnan200612.github.io` |

### Frontend (`client/.env.local` — local dev only)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:5000` |

> ⚠️ **Never commit `.env` files.** They are excluded by `.gitignore`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, React Router v6 |
| Charts | Recharts |
| Excel export | SheetJS (xlsx) |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (jwt-simple + bcryptjs) |
| Deployment | GitHub Pages (frontend), Render (backend) |

---

## 📄 License

MIT
