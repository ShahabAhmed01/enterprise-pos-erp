# 🏪 Enterprise POS & ERP Business Management System

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/Electron-Desktop%20App-green.svg" alt="Electron">
  <img src="https://img.shields.io/badge/React-18.2.0-61dafb.svg" alt="React">
  <img src="https://img.shields.io/badge/License-Proprietary-red.svg" alt="License">
</p>

> **Enterprise-Grade Point of Sale & Business Management Software** - A complete desktop application for supermarkets, restaurants, pharmacies, malls, warehouses, and retail chains.

---

## ✨ Features

### 📊 Dashboard & Analytics
- Real-time sales analytics with Chart.js animated charts
- Revenue, profit, and KPI tracking
- Best-selling products analysis
- Employee performance metrics
- Low stock alerts with visual indicators
- Daily sales trends with interactive line charts

### 💰 POS Billing Module
- **Touchscreen-optimized interface** with responsive grid layout
- Search products by name, SKU, or barcode
- Category-based product filtering
- Multiple cart/tab workflow
- Discount engine with percentage amounts
- Tax calculation (VAT/GST support)
- **Split payments** (Cash/Card/Mobile Money/Split)
- Hold and recall orders
- Returns & refunds processing
- **Auto-receipt printing** after order completion
- Full keyboard shortcuts (Ctrl+K to search, F1 for quick sale, Escape to close modals)
- Quick amount buttons for cash payments

### 📦 Inventory Management
- Product management with stock tracking
- Category & brand management
- Warehouse management
- Batch tracking & stock movements
- SKU & barcode generation
- Stock transfer between warehouses
- Low stock warnings with color-coded indicators
- Inventory valuation reporting

### 👥 CRM (Customer Relationship Management)
- Customer profiles with purchase history
- Membership tiers (Standard/Silver/Gold)
- Customer wallet/credit accounts
- Loyalty points system
- Wallet transaction history

### 🤝 Supplier Management
- Supplier database with contact info
- Purchase orders with GRN
- Supplier ledger with balances

### 💼 Accounting Module
- Chart of accounts with types
- Income & expense tracking
- Transaction management
- Account balance tracking

### 👨‍💼 HR Management
- Employee records with departments
- Attendance tracking
- Salary management
- Leave management

### 🏢 Multi-Branch Support
- Multiple branch management
- Centralized inventory
- Branch-specific reporting

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (Required for development)
- **npm** or **yarn** (Node Package Manager)
- **Git** (for version control)

### Installation

```bash
# Clone the repository
git clone https://github.com/ShahabAhmed01/enterprise-pos-erp.git
cd enterprise-pos-erp

# Install dependencies
npm install

# Start Vite development server (frontend only)
npm run dev

# Start full Electron development (backend + frontend)
npm run dev:main
```

### Default Login Credentials

| Role | Username / Email | Password |
|------|----------|----------|
| **Super Admin** | admin@enterprise-pos.com | admin123 |
| Manager | manager@enterprise-pos.com | manager123 |
| Cashier | cashier@enterprise-pos.com | cashier123 |

> **Note:** In demo/browser mode (without Electron), the app auto-logs in with admin credentials.

---

## 🖥️ Desktop Application

### Windows Installation

1. Build the application: `npm run build`
2. Find the installer in `release/` folder
3. Run the `.exe` installer
4. Follow the installation wizard
5. Launch from Start Menu or Desktop shortcut

### Features
- Native Windows experience with system tray
- Offline-first operation with local SQLite database
- Auto backup system
- System tray with quick actions
- Full keyboard navigation

---

## 📁 Project Structure

```
enterprise-pos-erp/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.js           # Main entry point with window management
│   │   ├── database.js       # SQLite database schema & seeding
│   │   └── ipc-handlers.js   # IPC communication handlers (40+ handlers)
│   ├── preload/
│   │   └── preload.js        # Context bridge API
│   └── renderer/             # React frontend
│       ├── components/       # Reusable components
│       │   ├── Sidebar.jsx   # Navigation sidebar
│       │   ├── TopBar.jsx    # Header with search & notifications
│       │   ├── Toast.jsx     # Notification toasts
│       │   └── ErrorBoundary.jsx # React error boundary
│       ├── pages/            # Page components
│       │   ├── Login.jsx     # Authentication
│       │   ├── Dashboard.jsx # Analytics & KPIs
│       │   ├── POS.jsx       # Point of Sale
│       │   ├── Products.jsx  # Product management
│       │   ├── Customers.jsx # CRM
│       │   ├── Settings.jsx  # Business settings
│       │   └── ... (20+ pages)
│       └── styles/
│           └── index.css     # TailwindCSS styles
├── docs/
│   ├── INSTALLATION.md       # Detailed installation guide
│   └── USER-MANUAL.md        # User manual
├── package.json              # Dependencies & scripts
├── vite.config.js            # Vite + Electron config
├── tailwind.config.js        # Tailwind CSS config
├── postcss.config.js         # PostCSS config
└── splash.html               # Splash screen
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Desktop Framework** | Electron | ^28.2.2 |
| **Frontend** | React.js + Vite | ^18.2.0 / ^5.1.2 |
| **Styling** | TailwindCSS | ^3.4.1 |
| **Animations** | Framer Motion | ^11.0.5 |
| **Database** | SQLite (better-sqlite3) | ^12.10.0 |
| **Charts** | Chart.js + react-chartjs-2 | ^4.4.1 / ^5.2.0 |
| **Icons** | Lucide React | ^0.344.0 |
| **Password Hashing** | bcryptjs | ^2.4.3 |
| **Build Tool** | Vite + electron-builder | - |
| **Date Handling** | date-fns | ^3.3.1 |

---

## 📋 System Requirements

### Minimum
- Windows 10 or later
- 4GB RAM
- 500MB disk space
- 1280x720 display

### Recommended
- Windows 11
- 8GB RAM
- 1GB SSD
- 1920x1080 display

---

## 🔒 Security Features

- Password hashing (bcrypt with 10 salt rounds)
- Role-based access control (RBAC) with 8 roles
- Session management with token expiry (24h)
- Account lockout after 5 failed attempts
- PIN-based quick login support
- Audit logging for all activities
- Secure local storage with encryption

---

## 📊 Database Schema

**40+ tables** covering all business domains:
- `users`, `roles`, `permissions`, `user_sessions`
- `products`, `categories`, `brands`, `units`, `product_variants`
- `stock`, `stock_movements`, `warehouses`, `transfers`
- `customers`, `customer_groups`, `customer_wallet_transactions`
- `suppliers`, `purchases`, `purchase_items`, `purchase_returns`
- `sales`, `sale_items`, `sale_payments`, `sales_returns`
- `accounts`, `account_transactions`, `transactions`, `expenses`
- `employees`, `attendance`, `leaves`, `shifts`, `salary_payments`
- `branches`, `cash_registers`, `cash_register_sessions`
- `coupons`, `held_orders`, `notifications`, `activity_logs`
- `settings`, `taxes`, `expense_categories`, `product_images`

---

## 🎨 UI/UX Features

- Glassmorphism and modern card-based design
- Smooth animations (Framer Motion)
- Responsive grid layouts
- Keyboard shortcuts throughout
- Touchscreen-optimized POS interface
- Real-time clock and date display
- Online/offline status indicator
- Notification system with bell icon
- Toast notifications for feedback

---

## 📞 Support

For issues or feature requests, please open an issue on [GitHub](https://github.com/ShahabAhmed01/enterprise-pos-erp/issues).

---

## 📄 License

**Proprietary** - All rights reserved. Unauthorized copying or distribution is prohibited.

---

<p align="center">
  <strong>Built with ❤️ for Enterprise Businesses</strong>
</p>