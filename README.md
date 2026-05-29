# 🏪 Enterprise POS & ERP Business Management System

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/Electron-Desktop%20App-green.svg" alt="Electron">
  <img src="https://img.shields.io/badge/License-Proprietary-red.svg" alt="License">
</p>

> **Enterprise-Grade Point of Sale & Business Management Software** - A complete desktop application for supermarkets, restaurants, pharmacies, malls, warehouses, and retail chains.

---

## ✨ Features

### 📊 Dashboard & Analytics
- Real-time sales analytics with animated charts
- Revenue, profit, and KPI tracking
- Best-selling products analysis
- Employee performance metrics
- Low stock alerts
- Branch performance comparison

### 💰 POS Billing Module
- **Ultra-fast barcode/QR scanner support**
- Touchscreen-optimized interface
- Multiple cart/tab workflow
- Discount engine with percentage/fixed amounts
- Tax calculation (VAT, GST support)
- Coupon and loyalty points system
- **Split payments** (Cash/Card/Bank/Mobile Money)
- Hold and suspend orders
- Returns & refunds processing
- Thermal printer support (ESC/POS)
- **Auto-receipt printing** after order completion
- Full keyboard shortcuts

### 📦 Inventory Management
- Product management with images
- Category & brand management
- Warehouse management
- Batch tracking & expiry alerts
- SKU & barcode generation
- Product variants & attributes
- Serial number tracking
- Stock transfer between branches
- Low stock warnings
- Inventory valuation (FIFO/AVCO)

### 👥 CRM (Customer Relationship Management)
- Customer profiles with purchase history
- Loyalty program & membership tiers
- Customer wallet/credit accounts
- Due payment tracking
- SMS & Email invoice support

### 🤝 Supplier Management
- Supplier database
- Purchase orders & GRN
- Supplier ledger
- Pending payments tracking
- Purchase returns

### 💼 Accounting Module
- Complete general ledger
- Income & expense tracking
- Journal entries
- Profit & Loss reports
- Trial balance
- Cash flow statements
- Tax reports

### 👨‍💼 HR Management
- Employee records
- Attendance tracking
- Salary management
- Leave management
- Shift scheduling
- Role-based permissions

### 🏢 Multi-Branch Support
- Multiple branch management
- Centralized inventory
- Branch-specific reporting
- Real-time synchronization

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Electron (for desktop build)

### Installation

```bash
# Clone the repository
git clone https://github.com/ShahabAhmed01/enterprise-pos-erp.git
cd enterprise-pos-erp

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Package as desktop app
npm run electron:build
```

### Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Super Admin | admin | admin123 |
| Manager | manager | manager123 |
| Cashier | cashier | cashier123 |

---

## 🖥️ Desktop Application

### Windows Installation

1. After building, find the executable in `release/` or `dist/` folder
2. Run the `.exe` installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### Features
- Native Windows experience
- Offline-first operation
- Local SQLite database
- Auto backup system
- System tray support
- Auto-start option

---

## 📁 Project Structure

```
enterprise-pos-erp/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.js          # Main entry point
│   │   ├── preload.js       # Preload scripts
│   │   ├── ipc-handlers.js  # IPC communication
│   │   └── database.js      # SQLite database
│   └── renderer/            # React frontend
│       ├── components/      # Reusable components
│       ├── pages/           # Page components
│       ├── styles/          # TailwindCSS styles
│       └── App.jsx          # Main app component
├── database/
│   └── init.sql             # Database schema
├── docs/
│   └── user-manual.md       # Detailed user guide
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Framework | Electron |
| Frontend | React.js + Vite |
| Styling | TailwindCSS |
| Animations | Framer Motion |
| Database | SQLite |
| Charts | Chart.js / ApexCharts |
| Build Tool | electron-builder |

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

- Password hashing (bcrypt)
- Role-based access control (RBAC)
- Session management
- Audit logging
- Activity monitoring
- Secure local storage

---

## 📊 Database Schema

40+ tables including:
- `users`, `roles`, `permissions`
- `products`, `categories`, `brands`
- `customers`, `suppliers`
- `sales`, `sale_items`
- `purchases`, `purchase_items`
- `accounts`, `transactions`
- `branches`, `warehouses`
- `employees`, `attendance`
- `expenses`, `payments`
- `notifications`, `activity_logs`

---

## 🎨 UI/UX Features

- Glassmorphism effects
- Smooth animations (Framer Motion)
- Dark/Light mode
- Responsive design
- Keyboard shortcuts
- Touchscreen support
- Multi-window architecture

---

## 📞 Support

For issues or feature requests, please open an issue on GitHub.

---

## 📄 License

Proprietary - All rights reserved. Unauthorized copying or distribution is prohibited.

---

<p align="center">
  <strong>Built with ❤️ for Enterprise Businesses</strong>
</p>
