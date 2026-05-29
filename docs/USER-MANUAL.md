# 📖 User Manual

## Enterprise POS & ERP System

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [POS Billing](#pos-billing)
4. [Products & Inventory](#products--inventory)
5. [Customers](#customers)
6. [Suppliers](#suppliers)
7. [Purchases](#purchases)
8. [Accounts & Accounting](#accounts--accounting)
9. [Expenses](#expenses)
10. [Employees](#employees)
11. [Settings](#settings)

---

## Getting Started

### Login
1. Launch application
2. Enter username and password
3. Click Login or press Enter

### Default Credentials
| Role | Username | Password |
|------|----------|----------|
| Super Admin | admin | admin123 |
| Manager | manager | manager123 |
| Cashier | cashier | cashier123 |

### Navigation
- **Sidebar**: Main navigation menu (collapsible)
- **Top Bar**: Search, notifications, user profile
- **Pages**: Content area for each module

---

## Dashboard

The main dashboard shows:

### KPI Cards
- Today's Sales
- Total Customers
- Low Stock Items
- Pending Orders

### Charts
- Sales trends (daily/weekly/monthly)
- Revenue vs Profit
- Top products
- Category distribution

### Quick Actions
- New Sale (F1)
- Add Product (F2)
- Quick Customer (F3)

---

## POS Billing

### Starting a Sale
1. Press **F1** or click "New Sale"
2. Scan barcode or search product
3. Adjust quantity if needed
4. Apply discounts (optional)

### Product Search
- Type product name/barcode
- Use category filters
- Browse product grid

### Cart Operations
| Action | Shortcut |
|--------|----------|
| Add Item | Enter/Click |
| Remove Item | Delete |
| Clear Cart | Ctrl+Delete |
| Hold Order | Ctrl+H |
| Apply Discount | Ctrl+D |

### Checkout
1. Click "Checkout" or press F5
2. Select payment method
3. Handle split payments if needed
4. Confirm payment
5. Receipt prints automatically

### Payment Methods
- Cash
- Card (Credit/Debit)
- Bank Transfer
- Mobile Money
- Multiple (Split Payment)

### Hold & Recall
- **Hold**: Ctrl+H to suspend current sale
- **Recall**: F6 to show held orders

### Returns
1. Press F7 or click "Returns"
2. Enter original invoice number
3. Select items to return
4. Process refund

---

## Products & Inventory

### Product Management

#### Add New Product
1. Go to Products → Add Product
2. Fill in details:
   - Product Name
   - SKU (auto-generated)
   - Barcode (scan or enter)
   - Category
   - Brand
   - Purchase Price
   - Selling Price
   - Tax Rate
   - Stock Quantity
3. Upload image (optional)
4. Save

#### Product Fields
| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Product display name |
| SKU | Auto | Stock keeping unit |
| Barcode | No | For scanning |
| Category | Yes | Product category |
| Cost Price | Yes | Purchase price |
| Selling Price | Yes | Retail price |
| Stock | Yes | Current quantity |
| Low Stock Alert | No | Alert threshold |

### Categories
- Create hierarchical categories
- Assign colors/icons
- Set default tax rates

### Brands
- Create and manage brands
- Filter products by brand

### Inventory
- View all stock levels
- Low stock alerts
- Stock adjustments
- Batch management
- Expiry tracking

### Transfers
- Transfer between warehouses
- Branch transfers
- Transfer history

---

## Customers

### Customer Management
1. Go to Customers
2. Click "Add Customer"
3. Fill details:
   - Name
   - Phone
   - Email
   - Address
   - Membership Type
4. Save

### Membership Levels
- Regular
- Silver
- Gold
- Platinum

### Customer Wallet
- Add credit to customer account
- Deduct on purchase
- View transaction history

### Due Payments
- Track customer credit
- Send payment reminders
- Record payments

---

## Suppliers

### Supplier Management
1. Go to Suppliers
2. Click "Add Supplier"
3. Enter details:
   - Company Name
   - Contact Person
   - Phone
   - Email
   - Address
4. Save

### Purchase Orders
1. Go to Purchases → New Purchase
2. Select supplier
3. Add products
4. Set quantities and prices
5. Save as Draft or Submit

### Goods Receiving
1. Go to Purchases → Receive Stock
2. Select purchase order
3. Verify received items
4. Confirm receipt

### Supplier Payments
- Track outstanding payments
- Record payments
- View supplier ledger

---

## Purchases

### Purchase Workflow
1. **Create Purchase Order**
2. **Send to Supplier**
3. **Receive Goods**
4. **Record Payment**

### Purchase Types
- Direct Purchase
- Purchase Order
- Import

### Purchase Returns
1. Go to Purchases → Returns
2. Select original purchase
3. Mark items for return
4. Process return

---

## Accounts & Accounting

### Chart of Accounts
Pre-configured account structure:
- Assets
- Liabilities
- Equity
- Revenue
- Expenses

### Journal Entries
1. Go to Accounts → Journal
2. Click "New Entry"
3. Select accounts
4. Enter debit/credit amounts
5. Add description
6. Save

### Financial Reports
- Profit & Loss Statement
- Balance Sheet
- Trial Balance
- Cash Flow Statement

---

## Expenses

### Expense Categories
- Rent
- Utilities
- Salaries
- Marketing
- Supplies
- Maintenance
- Miscellaneous

### Recording Expenses
1. Go to Expenses
2. Click "Add Expense"
3. Select category
4. Enter amount and description
5. Add receipt (optional)
6. Save

---

## Employees

### Employee Management
1. Go to Employees
2. Click "Add Employee"
3. Enter details:
   - Personal Info
   - Contact Info
   - Role/Position
   - Department
   - Salary
4. Save

### Attendance
- Daily check-in/check-out
- Manual attendance entry
- Attendance reports

### Leave Management
- Request leave
- Approve/reject leave
- Leave balance tracking

### Roles & Permissions
| Role | Permissions |
|------|-------------|
| Super Admin | Full access |
| Admin | All except system |
| Manager | Limited admin |
| Cashier | POS only |
| Accountant | Accounts only |

---

## Settings

### Business Settings
- Business name
- Logo
- Address
- Phone/Email
- Tax ID

### Tax Settings
- Tax name (VAT/GST)
- Tax rates
- Inclusive/exclusive pricing

### Invoice Settings
- Invoice prefix
- Footer text
- Terms & conditions

### Printer Settings
- Receipt printer
- Invoice printer
- Label printer

### User Settings
- Change password
- User preferences
- Display settings

### Database
- Backup database
- Restore backup
- Clear data

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| F1 | New Sale |
| F2 | Add Product |
| F3 | Quick Customer |
| F5 | Checkout |
| F6 | Recall Hold |
| F7 | Returns |
| F8 | Quick Search |
| Ctrl+S | Save |
| Ctrl+P | Print |
| Ctrl+N | New |
| Ctrl+H | Hold Sale |
| Ctrl+D | Apply Discount |
| Esc | Cancel/Close |

---

## Troubleshooting

### Common Issues

**Can't login?**
- Check credentials
- Clear browser cache
- Reset password

**Sales not saving?**
- Check database connection
- Contact admin

**Printer not working?**
- Check printer connection
- Verify printer settings
- Test print

**Slow performance?**
- Clear old transactions
- Backup and optimize database
- Check disk space

---

## Support

For additional help:
- GitHub Issues: https://github.com/ShahabAhmed01/enterprise-pos-erp/issues
