# Enterprise POS & ERP

<div align="center">
  <br/>
  <img src="https://img.shields.io/badge/Version-1.0.2-4F46E5?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/Architecture-Electron_|_React_|_Vite-10B981?style=for-the-badge" alt="Architecture"/>
  <img src="https://img.shields.io/badge/Database-SQLite_WASM-EF4444?style=for-the-badge" alt="Database"/>
  <img src="https://img.shields.io/badge/License-MIT-3B82F6?style=for-the-badge" alt="License"/>
  <br/><br/>
</div>

**Enterprise POS & ERP** is a production-grade, offline-first desktop application for retail and business management. It combines a lightning-fast Point of Sale with full Enterprise Resource Planning — inventory, accounting, CRM, HR, and reporting — all in a single, self-contained executable.

---

## Features

### Point of Sale
- **Touchscreen-Optimized Checkout** — designed for rapid, high-volume cashier workflows
- **Split Payments** — cash, card, and mobile wallet in a single transaction
- **Order Management** — hold, recall, and manage multiple customer tabs
- **Hardware Ready** — barcode scanner and thermal receipt printer support

### Inventory & Warehouse
- **Multi-Warehouse** — transfer stock between locations with full audit trails
- **Real-Time Stock** — live quantity tracking with low-stock alerts
- **Stock Movements** — every inbound/outbound transaction logged automatically

### Accounting & Finance
- **Chart of Accounts** — assets, liabilities, revenue, and expense accounts
- **Transaction Ledger** — all financial activity recorded with running balances
- **Expense Tracking** — categorize and track business expenses by vendor
- **Purchase Orders** — create, approve, and receive purchase orders

### Customer Relationship Management
- **Tiered Loyalty** — Gold / Silver / Standard membership with points
- **Customer Profiles** — full purchase history, wallet balance, contact details

### Human Resources
- **Employee Management** — designations, departments, salary, and attendance
- **Role-Based Access** — Super Admin, Manager, Cashier roles with scoped permissions

### Reporting & Analytics
- **Dashboard KPIs** — daily sales, orders, profit, and low-stock widgets
- **Sales Charts** — trend lines and profit breakdown doughnut
- **Activity Logs** — full audit trail of system actions

---

## Quick Start

### Download & Run

| Download | Description |
|----------|-------------|
| [Enterprise POS ERP Setup 1.0.0.exe](https://github.com/ShahabAhmed01/enterprise-pos-erp/releases) | Windows installer — adds Start Menu shortcut |
| [Enterprise POS ERP 1.0.0.exe](https://github.com/ShahabAhmed01/enterprise-pos-erp/releases) | Portable — run directly, no installation |

First launch auto-seeds a rich demo dataset. Use these credentials to sign in:

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | admin@enterprise-pos.com | admin123 |
| **Manager** | manager@enterprise-pos.com | admin123 |
| **Cashier** | cashier@enterprise-pos.com | admin123 |

### Build from Source

**Prerequisites:** Node.js v20+, npm

```bash
git clone https://github.com/ShahabAhmed01/enterprise-pos-erp.git
cd enterprise-pos-erp
npm install
npm run build
```

The built installer and portable executable will be in the `release/` directory.

### Development

```bash
npm run dev:electron
```

Launches Vite dev server + Electron with hot-reload.

---

## Role-Based Access Control

| Module | Super Admin | Manager | Cashier |
|--------|:-----------:|:-------:|:-------:|
| Dashboard | ✓ | ✓ | — |
| Point of Sale | ✓ | ✓ | ✓ |
| Sales (view all) | ✓ | ✓ | — |
| Sales (own only) | ✓ | — | ✓ |
| Returns | ✓ | ✓ | Create only |
| Products (CRUD) | ✓ | View/Edit | — |
| Categories | ✓ | View | — |
| Brands | ✓ | View | — |
| Inventory | ✓ | View | — |
| Transfers | ✓ | View/Create | — |
| Customers | ✓ | ✓ | View/Add |
| Suppliers | ✓ | View | — |
| Employees | ✓ | View | — |
| Accounts | ✓ | — | — |
| Expenses | ✓ | View/Add | — |
| Purchases | ✓ | View/Add | — |
| Reports | ✓ | View | — |
| Activity Logs | ✓ | — | — |
| Settings | ✓ | — | — |
| Notifications | ✓ | — | — |

---

## Demo Data

The first launch seeds a comprehensive dataset so you can evaluate every feature immediately:

| Entity | Count | Highlights |
|--------|:-----:|------------|
| **Products** | 21 | iPhone 15 Pro, Samsung Galaxy S24, Sony WH-1000XM5, MacBook Air M3, iPad Pro 12.9, Nike Air Max 270, Adidas Ultraboost 22, Coca-Cola, Pepsi, Nestle, and more across 4 categories |
| **Customers** | 7 | Ahmed Khan (Rawalpindi), Sara Ali (Islamabad), Muhammad Usman (Lahore), Fatima Sheikh (Karachi), Hassan Raza (Peshawar), Ayesha Malik (Multan), Bilal Ahmed (Faisalabad) |
| **Suppliers** | 5 | TechWorld Distributors, Fashion Hub Wholesale, FoodMart Distributors, Apple Pakistan, Nike Pakistan |
| **Employees** | 6 | 4 active (Branch Manager, Cashier, Inventory Manager, Accountant) — 2 inactive |
| **Sales** | 15 | 14-day history with multiple line-items per sale, mixed cash/card |
| **Expenses** | 7 | Rent, Electricity, Internet, Salaries, Supplies, Marketing, Maintenance |
| **Purchase Orders** | 5 | Received, pending, and ordered statuses across 5 suppliers |
| **Stock Transfers** | 5 | Cross-warehouse transfers with completed, pending, and sent statuses |
| **Returns** | 3 | Sales returns with approved status and item-level detail |
| **Account Transactions** | 9 | Opening balances and ledger entries for all 9 accounts |
| **Activity Logs** | 16 | Login events, sales, inventory changes, system actions |
| **Notifications** | 5 | Low-stock alerts, system messages, and achievement alerts |

**Low-stock alerts are triggered for:** Nike Air Max 270 (3 in stock / 10 minimum) and iPad Pro 12.9 (4 / 5).

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|:-------:|
| Desktop Runtime | Electron | 28.2.2 |
| User Interface | React | 18.2.0 |
| Build Tool | Vite | 5.1.2 |
| Styling | Tailwind CSS | 3 |
| Animations | Framer Motion | 11 |
| Database | SQL.js (SQLite via WASM) | 1.8 |
| Charts | Chart.js | 4.4 |
| Security | bcryptjs | 2.4 |
| State | React Context | — |

### Architecture

```
┌─────────────────────────────────────────────────┐
│              Presentation Layer                  │
│         React 18  +  Tailwind  +  Framer         │
│               (Isolated Renderer)                 │
├─────────────────────────────────────────────────┤
│              Context Bridge API                   │
│         Preload Script  (Security Boundary)        │
├─────────────────────────────────────────────────┤
│              Core Processing Layer                │
│        Electron Main Process  +  IPC Handlers     │
├─────────────────────────────────────────────────┤
│              Data Persistence Layer               │
│    SQL.js (SQLite WASM)  →  File System  →  AES   │
└─────────────────────────────────────────────────┘
```

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|:-------:|:-----------:|
| OS | Windows 10 / macOS 10.13 / Ubuntu 20.04 | Windows 11 / macOS 14 |
| Processor | Intel i3-7xxx / AMD Ryzen 3 | Intel i5 / AMD Ryzen 5 |
| RAM | 4 GB | 8 GB |
| Storage | 1 GB SSD | 2 GB SSD |
| Screen | 1366 × 768 | 1920 × 1080 |

---

## Troubleshooting

### Blank Windows on Startup

Zombie processes from a previous debug session hold port 5173.

```bash
taskkill /F /IM electron.exe && taskkill /F /IM node.exe
```

### Build Fails with Node.js Errors

Use Node.js v20 LTS. Incompatible versions (v22+) may break native module compilation.

### Database Error: `Statement closed`

This was patched in v1.0.1. Ensure you are using the latest release.

### Slow First Launch

The first launch seeds the database (1–3 seconds). Subsequent launches are instant.

---

## Releases

All releases are published on the [GitHub Releases page](https://github.com/ShahabAhmed01/enterprise-pos-erp/releases).

| Version | Date | Highlights |
|:-------:|:----:|------------|
| v1.0.2 | May 2026 | Rich Pakistani demo data, instant startup, modal centering, RBAC, notifications fix, chart colors |
| v1.0.1 | May 2026 | Packaging fixes, GPU disable, database statement reuse fix |
| v1.0.0 | — | Initial release |

---

## License

This project is open source under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with Electron, React, and SQL.js</sub>
</div>
