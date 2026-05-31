import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import log from 'electron-log';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

let db = null;
let rawDb = null;
let dbPath = null;
let isDirty = false;

function getDatabase() {
  return db;
}

function saveDatabase() {
  if (!rawDb || !isDirty || !dbPath) return;
  const data = rawDb.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  isDirty = false;
  log.info(`Database saved to ${dbPath}`);
}

function extractRow(stmt) {
  const values = stmt.get ? stmt.get() : [];
  const columns = stmt.getColumnNames ? stmt.getColumnNames() : [];
  const row = {};
  columns.forEach((column, index) => {
    row[column] = values[index];
  });
  return row;
}

function createStatement(sql) {
  return {
    run(...params) {
      const stmt = rawDb.prepare(sql);
      stmt.bind(params);
      const result = stmt.step();
      stmt.free();
      isDirty = true;
      saveDatabase();
      return result;
    },
    get(...params) {
      const stmt = rawDb.prepare(sql);
      stmt.bind(params);
      const hasRow = stmt.step();
      const row = hasRow ? extractRow(stmt) : undefined;
      stmt.free();
      return row;
    },
    all(...params) {
      const stmt = rawDb.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(extractRow(stmt));
      }
      stmt.free();
      return rows;
    }
  };
}

async function initDatabase() {
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'enterprise_pos.db');
  log.info(`Initializing database at: ${dbPath}`);

  const SQL = await initSqlJs({
    locateFile: file => {
      if (app.isPackaged) {
        return path.join(process.resourcesPath, file);
      }
      return path.join(__dirname, file);
    }
  });

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    rawDb = new SQL.Database(new Uint8Array(fileBuffer));
  } else {
    rawDb = new SQL.Database();
  }

  rawDb.exec('PRAGMA journal_mode = WAL;');
  rawDb.exec('PRAGMA foreign_keys = ON;');
  rawDb.exec('PRAGMA synchronous = NORMAL;');
  rawDb.exec('PRAGMA cache_size = -64000;');
  rawDb.exec('PRAGMA temp_store = MEMORY;');

  db = {
    prepare: createStatement,
    exec(sql) {
      const result = rawDb.exec(sql);
      if (!sql.trim().toUpperCase().startsWith('SELECT')) {
        isDirty = true;
        saveDatabase();
      }
      return result;
    },
    pragma(sql) {
      const statement = sql.trim().toUpperCase().startsWith('PRAGMA') ? sql : `PRAGMA ${sql}`;
      rawDb.exec(statement);
    },
    close() {
      saveDatabase();
      rawDb.close();
      rawDb = null;
      db = null;
    }
  };

  createTables();
  createIndexes();
  await seedInitialData();
  saveDatabase();

  log.info('Database tables created and seeded successfully');
  return db;
}

function createTables() {
  // Users and Authentication
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      avatar TEXT,
      role_id TEXT NOT NULL,
      pin TEXT,
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      login_attempts INTEGER DEFAULT 0,
      locked_until TEXT,
      remember_token TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      permissions TEXT,
      is_system INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      device_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      device_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Branches and Warehouses
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      phone TEXT,
      email TEXT,
      is_active INTEGER DEFAULT 1,
      is_main INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      timezone TEXT DEFAULT 'UTC',
      tax_number TEXT,
      logo TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      branch_id TEXT,
      address TEXT,
      is_active INTEGER DEFAULT 1,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );

    -- Product Management
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      parent_id TEXT,
      image TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      logo TEXT,
      website TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      barcode TEXT,
      qr_code TEXT,
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      brand_id TEXT,
      unit_id TEXT,
      cost_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      wholesale_price REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_method TEXT DEFAULT 'exclusive',
      weight REAL,
      dimensions TEXT,
      min_stock_level INTEGER DEFAULT 0,
      max_stock_level INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_track_stock INTEGER DEFAULT 1,
      is_sellable INTEGER DEFAULT 1,
      is_purchasable INTEGER DEFAULT 1,
      image TEXT,
      images TEXT,
      variations TEXT,
      attributes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      barcode TEXT,
      name TEXT NOT NULL,
      cost_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      wholesale_price REAL DEFAULT 0,
      stock_quantity INTEGER DEFAULT 0,
      attributes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      is_integer INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      variant_id TEXT,
      warehouse_id TEXT,
      movement_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      batch_number TEXT,
      expiry_date TEXT,
      notes TEXT,
      user_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (variant_id) REFERENCES product_variants(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stock (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      warehouse_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      reserved_quantity INTEGER DEFAULT 0,
      available_quantity INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, variant_id, warehouse_id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (variant_id) REFERENCES product_variants(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      from_warehouse_id TEXT NOT NULL,
      to_warehouse_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      items TEXT,
      total_items INTEGER DEFAULT 0,
      notes TEXT,
      initiated_by TEXT,
      received_by TEXT,
      sent_at TEXT,
      received_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Customers and CRM
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      company TEXT,
      tax_number TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      postal_code TEXT,
      customer_group_id TEXT,
      customer_type TEXT DEFAULT 'individual',
      credit_limit REAL DEFAULT 0,
      opening_balance REAL DEFAULT 0,
      wallet_balance REAL DEFAULT 0,
      loyalty_points INTEGER DEFAULT 0,
      membership_level TEXT DEFAULT 'standard',
      is_taxable INTEGER DEFAULT 1,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_group_id) REFERENCES customer_groups(id)
    );

    CREATE TABLE IF NOT EXISTS customer_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      discount_percentage REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customer_wallet_transactions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      description TEXT,
      balance_after REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    -- Suppliers and Purchases
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT,
      phone TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      postal_code TEXT,
      tax_number TEXT,
      website TEXT,
      opening_balance REAL DEFAULT 0,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      supplier_id TEXT NOT NULL,
      warehouse_id TEXT,
      status TEXT DEFAULT 'pending',
      total REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      discount_percentage REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      shipping_cost REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      purchase_date TEXT NOT NULL,
      due_date TEXT,
      notes TEXT,
      created_by TEXT,
      approved_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      product_id TEXT,
      variant_id TEXT,
      warehouse_id TEXT,
      quantity INTEGER NOT NULL,
      received_quantity INTEGER DEFAULT 0,
      unit_price REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      subtotal REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_returns (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      purchase_id TEXT,
      supplier_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      total REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_return_items (
      id TEXT PRIMARY KEY,
      return_id TEXT NOT NULL,
      purchase_item_id TEXT,
      product_id TEXT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (return_id) REFERENCES purchase_returns(id)
    );

    -- Sales and POS
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      customer_id TEXT,
      user_id TEXT NOT NULL,
      warehouse_id TEXT,
      branch_id TEXT,
      status TEXT DEFAULT 'completed',
      sub_total REAL DEFAULT 0,
      total_discount REAL DEFAULT 0,
      total_tax REAL DEFAULT 0,
      shipping_cost REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      payment_method TEXT,
      coupon_id TEXT,
      coupon_discount REAL DEFAULT 0,
      loyalty_points_earned INTEGER DEFAULT 0,
      loyalty_points_used INTEGER DEFAULT 0,
      notes TEXT,
      order_type TEXT DEFAULT 'direct',
      tax_rate REAL DEFAULT 0,
      cash_register_id TEXT,
      sale_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      warehouse_id TEXT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      discount_percentage REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      subtotal REAL NOT NULL,
      product_name TEXT,
      product_sku TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    );

    CREATE TABLE IF NOT EXISTS sale_payments (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      amount REAL NOT NULL,
      reference_number TEXT,
      card_holder TEXT,
      card_last_four TEXT,
      bank_name TEXT,
      mobile_number TEXT,
      transaction_id TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );

    CREATE TABLE IF NOT EXISTS sales_returns (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      sale_id TEXT NOT NULL,
      customer_id TEXT,
      reason TEXT NOT NULL,
      total REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS sales_return_items (
      id TEXT PRIMARY KEY,
      return_id TEXT NOT NULL,
      sale_item_id TEXT,
      product_id TEXT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (return_id) REFERENCES sales_returns(id)
    );

    CREATE TABLE IF NOT EXISTS held_orders (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      order_data TEXT NOT NULL,
      items_count INTEGER DEFAULT 0,
      grand_total REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      type TEXT DEFAULT 'percentage',
      value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount_amount REAL,
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Accounting
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      account_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      subtype TEXT,
      parent_id TEXT,
      description TEXT,
      opening_balance REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_system INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS account_transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_after REAL,
      reference_type TEXT,
      reference_id TEXT,
      description TEXT,
      user_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      account_id TEXT,
      category TEXT,
      payment_method TEXT,
      is_transfer INTEGER DEFAULT 0,
      transfer_id TEXT,
      attachment TEXT,
      user_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      account_id TEXT,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      vendor TEXT,
      payment_method TEXT,
      receipt TEXT,
      is_invoiceable INTEGER DEFAULT 0,
      status TEXT DEFAULT 'approved',
      user_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS expense_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Employees and HR
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      employee_code TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      designation TEXT,
      department TEXT,
      date_of_joining TEXT,
      date_of_birth TEXT,
      gender TEXT,
      blood_group TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      bank_name TEXT,
      bank_account TEXT,
      salary REAL DEFAULT 0,
      salary_type TEXT DEFAULT 'monthly',
      is_active INTEGER DEFAULT 1,
      termination_date TEXT,
      photo TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      date TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      status TEXT DEFAULT 'present',
      remarks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS leaves (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      leave_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      days INTEGER NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      approved_by TEXT,
      approved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      break_duration INTEGER DEFAULT 0,
      working_hours REAL,
      is_night_shift INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_payments (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      basic_salary REAL NOT NULL,
      allowances REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      net_salary REAL NOT NULL,
      payment_date TEXT,
      payment_method TEXT,
      status TEXT DEFAULT 'paid',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- Settings and Configuration
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      type TEXT DEFAULT 'string',
      group_name TEXT,
      description TEXT,
      is_public INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      is_read INTEGER DEFAULT 0,
      read_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS taxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      rate REAL NOT NULL,
      type TEXT DEFAULT 'percentage',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cash_registers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      warehouse_id TEXT,
      opening_balance REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      status TEXT DEFAULT 'closed',
      opened_at TEXT,
      closed_at TEXT,
      opened_by TEXT,
      closed_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS cash_register_sessions (
      id TEXT PRIMARY KEY,
      register_id TEXT NOT NULL,
      opening_amount REAL DEFAULT 0,
      closing_amount REAL DEFAULT 0,
      expected_amount REAL DEFAULT 0,
      variance REAL DEFAULT 0,
      notes TEXT,
      opened_by TEXT,
      closed_by TEXT,
      opened_at TEXT DEFAULT CURRENT_TIMESTAMP,
      closed_at TEXT,
      FOREIGN KEY (register_id) REFERENCES cash_registers(id)
    );
  `);
}

function createIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)',
    'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date)',
    'CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date)',
    'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)',
    'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)',
    'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)',
    'CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id)',
    'CREATE INDEX IF NOT EXISTS idx_stock_warehouse ON stock(warehouse_id)',
    'CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)'
  ];

  indexes.forEach(index => {
    try {
      db.exec(index);
    } catch (e) {
      log.warn(`Index creation warning: ${e.message}`);
    }
  });
}

async function seedInitialData() {
  const existingRoles = db.prepare('SELECT COUNT(*) as count FROM roles').get();
  if (existingRoles.count > 0) {
    log.info('Data already seeded, skipping...');
    return;
  }

  log.info('Seeding initial data...');

  // Create roles
  const roles = [
    { id: uuidv4(), name: 'Super Admin', description: 'Full system access', permissions: JSON.stringify(['*']), is_system: 1 },
    { id: uuidv4(), name: 'Admin', description: 'Administrative access', permissions: JSON.stringify(['*']), is_system: 1 },
    { id: uuidv4(), name: 'Manager', description: 'Store management access', permissions: JSON.stringify(['sales', 'inventory', 'reports', 'customers']), is_system: 1 },
    { id: uuidv4(), name: 'Cashier', description: 'Point of sale access', permissions: JSON.stringify(['sales', 'customers']), is_system: 1 },
    { id: uuidv4(), name: 'Accountant', description: 'Accounting access', permissions: JSON.stringify(['accounts', 'transactions', 'expenses', 'reports']), is_system: 1 },
    { id: uuidv4(), name: 'Warehouse Staff', description: 'Inventory management access', permissions: JSON.stringify(['inventory', 'transfers', 'products']), is_system: 1 },
    { id: uuidv4(), name: 'Branch Manager', description: 'Branch level management', permissions: JSON.stringify(['sales', 'inventory', 'reports', 'employees']), is_system: 1 },
    { id: uuidv4(), name: 'Delivery Staff', description: 'Delivery management access', permissions: JSON.stringify(['deliveries', 'orders']), is_system: 1 }
  ];

  roles.forEach(role => db.prepare('INSERT INTO roles (id, name, description, permissions, is_system) VALUES (?, ?, ?, ?, ?)').run(role.id, role.name, role.description, role.permissions, role.is_system));

  // Create users
  const adminRoleId = roles[0].id;
  const hashedPassword = '$2a$10$.4eUej4iLU9guHU3o6laJuKvEjqqzEi/ZwR7O19F4GHzgs.G0bmtW';
  const adminUserId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, pin, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(adminUserId, 'admin@enterprise-pos.com', hashedPassword, 'System', 'Administrator', '+1234567890', adminRoleId, '1234', 1);

  const managerUserId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, pin, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(managerUserId, 'manager@enterprise-pos.com', hashedPassword, 'Branch', 'Manager', '+1234567891', roles[2].id, '2345', 1);

  const cashierUserId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, pin, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(cashierUserId, 'cashier@enterprise-pos.com', hashedPassword, 'POS', 'Cashier', '+1234567892', roles[3].id, '3456', 1);

  // Create branch
  const mainBranchId = uuidv4();
  db.prepare(`
    INSERT INTO branches (id, name, code, address, city, country, is_main, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(mainBranchId, 'Main Store', 'HQ001', '123 Business Street', 'New York', 'USA', 1, 1);

  // Create warehouse
  const mainWarehouseId = uuidv4();
  db.prepare(`
    INSERT INTO warehouses (id, name, code, branch_id, is_default, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(mainWarehouseId, 'Main Warehouse', 'WH001', mainBranchId, 1, 1);

  // Create units
  const units = [
    { id: uuidv4(), name: 'Piece', short_name: 'pcs', is_integer: 1 },
    { id: uuidv4(), name: 'Kilogram', short_name: 'kg', is_integer: 0 },
    { id: uuidv4(), name: 'Gram', short_name: 'g', is_integer: 0 },
    { id: uuidv4(), name: 'Liter', short_name: 'L', is_integer: 0 },
    { id: uuidv4(), name: 'Milliliter', short_name: 'ml', is_integer: 0 },
    { id: uuidv4(), name: 'Meter', short_name: 'm', is_integer: 0 },
    { id: uuidv4(), name: 'Box', short_name: 'box', is_integer: 1 },
    { id: uuidv4(), name: 'Pack', short_name: 'pack', is_integer: 1 }
  ];

  units.forEach(unit => db.prepare('INSERT INTO units (id, name, short_name, is_integer) VALUES (?, ?, ?, ?)').run(unit.id, unit.name, unit.short_name, unit.is_integer));

  // Create categories
  const categories = [
    { id: uuidv4(), name: 'Electronics', description: 'Electronic devices and accessories' },
    { id: uuidv4(), name: 'Groceries', description: 'Food and household items' },
    { id: uuidv4(), name: 'Fashion', description: 'Clothing and accessories' },
    { id: uuidv4(), name: 'Home & Garden', description: 'Home improvement and garden items' },
    { id: uuidv4(), name: 'Health & Beauty', description: 'Health and beauty products' },
    { id: uuidv4(), name: 'Sports', description: 'Sports and outdoor equipment' },
    { id: uuidv4(), name: 'Books & Stationery', description: 'Books and office supplies' },
    { id: uuidv4(), name: 'Toys & Games', description: 'Toys and games for all ages' }
  ];

  categories.forEach(cat => db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)').run(cat.id, cat.name, cat.description));

  // Create brands
  const brands = [
    { id: uuidv4(), name: 'Apple', description: 'Apple Inc.' },
    { id: uuidv4(), name: 'Samsung', description: 'Samsung Electronics' },
    { id: uuidv4(), name: 'Sony', description: 'Sony Corporation' },
    { id: uuidv4(), name: 'Nike', description: 'Nike Inc.' },
    { id: uuidv4(), name: 'Adidas', description: 'Adidas AG' },
    { id: uuidv4(), name: 'Coca-Cola', description: 'The Coca-Cola Company' },
    { id: uuidv4(), name: 'Pepsi', description: 'PepsiCo' },
    { id: uuidv4(), name: 'Nestle', description: 'Nestlé S.A.' }
  ];

  brands.forEach(brand => db.prepare('INSERT INTO brands (id, name, description) VALUES (?, ?, ?)').run(brand.id, brand.name, brand.description));

  // Create products
  const categoryIds = categories.map(c => c.id);
  const brandIds = brands.map(b => b.id);
  const unitPcsId = units[0].id;
  const productIds = [];

  const productData = [
    { sku: 'ELEC001', barcode: '123456789001', name: 'iPhone 15 Pro', category_id: categoryIds[0], brand_id: brandIds[0], cost: 750.00, price: 999.00, stock: 45, min_stock: 5 },
    { sku: 'ELEC002', barcode: '123456789002', name: 'Samsung Galaxy S24', category_id: categoryIds[0], brand_id: brandIds[1], cost: 650.00, price: 899.00, stock: 38, min_stock: 5 },
    { sku: 'ELEC003', barcode: '123456789003', name: 'Sony WH-1000XM5 Headphones', category_id: categoryIds[0], brand_id: brandIds[2], cost: 220.00, price: 349.00, stock: 60, min_stock: 10 },
    { sku: 'ELEC004', barcode: '123456789004', name: 'MacBook Air M3', category_id: categoryIds[0], brand_id: brandIds[0], cost: 950.00, price: 1299.00, stock: 22, min_stock: 3 },
    { sku: 'ELEC005', barcode: '123456789005', name: 'iPad Pro 12.9', category_id: categoryIds[0], brand_id: brandIds[0], cost: 800.00, price: 1099.00, stock: 30, min_stock: 5 },
    { sku: 'FASH001', barcode: '345678901001', name: 'Nike Air Max 270', category_id: categoryIds[2], brand_id: brandIds[3], cost: 85.00, price: 150.00, stock: 8, min_stock: 10 },
    { sku: 'FASH002', barcode: '345678901002', name: 'Adidas Ultraboost 22', category_id: categoryIds[2], brand_id: brandIds[4], cost: 100.00, price: 180.00, stock: 55, min_stock: 10 },
    { sku: 'GROC001', barcode: '234567890001', name: 'Pepsi 24 Pack', category_id: categoryIds[1], brand_id: brandIds[6], cost: 10.00, price: 18.00, stock: 200, min_stock: 50 },
    { sku: 'GROC002', barcode: '234567890002', name: 'Coca-Cola 24 Pack', category_id: categoryIds[1], brand_id: brandIds[5], cost: 10.00, price: 18.00, stock: 180, min_stock: 50 },
    { sku: 'GROC003', barcode: '234567890003', name: 'Nestle Pure Life Water 24 Pack', category_id: categoryIds[1], brand_id: brandIds[7], cost: 6.00, price: 12.00, stock: 300, min_stock: 100 }
  ];
  productData.forEach(product => {
    const productId = uuidv4();
    productIds.push(productId);
    db.prepare(`
      INSERT INTO products (id, sku, barcode, name, description, category_id, brand_id, unit_id, cost_price, selling_price, min_stock_level, tax_rate, is_track_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      productId,
      product.sku,
      product.barcode,
      product.name,
      `High quality ${product.name.toLowerCase()}`,
      product.category_id,
      product.brand_id,
      unitPcsId,
      product.cost,
      product.price,
      product.min_stock,
      10.00,
      1
    );

    db.prepare(`
      INSERT INTO stock (id, product_id, warehouse_id, quantity, available_quantity)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), productId, mainWarehouseId, product.stock, product.stock);
  });

  // Create customers
  const customerIds = [];
  const customerData = [
    { code: 'CUST001', first_name: 'Ahmed', last_name: 'Khan', email: 'ahmed.khan@email.com', phone: '+92-300-1234567', city: 'Rawalpindi', type: 'individual', level: 'gold', points: 1500 },
    { code: 'CUST002', first_name: 'Sara', last_name: 'Ali', email: 'sara.ali@email.com', phone: '+92-321-2345678', city: 'Islamabad', type: 'individual', level: 'silver', points: 800 },
    { code: 'CUST003', first_name: 'Muhammad', last_name: 'Usman', email: 'm.usman@email.com', phone: '+92-333-3456789', city: 'Lahore', type: 'individual', level: 'standard', points: 200 },
    { code: 'CUST004', first_name: 'Fatima', last_name: 'Sheikh', email: 'fatima.s@email.com', phone: '+92-345-4567890', city: 'Karachi', type: 'individual', level: 'gold', points: 2200 },
    { code: 'CUST005', first_name: 'Hassan', last_name: 'Raza', email: 'hassan.r@email.com', phone: '+92-311-5678901', city: 'Peshawar', type: 'individual', level: 'silver', points: 650 },
    { code: 'CUST006', first_name: 'Ayesha', last_name: 'Malik', email: 'ayesha.m@email.com', phone: '+92-322-6789012', city: 'Multan', type: 'individual', level: 'standard', points: 100 },
    { code: 'CUST007', first_name: 'Bilal', last_name: 'Ahmed', email: 'bilal.a@email.com', phone: '+92-333-7890123', city: 'Faisalabad', type: 'individual', level: 'gold', points: 3100 }
  ];
  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, code, first_name, last_name, email, phone, city, customer_type, membership_level, loyalty_points, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  customerData.forEach(cust => {
    const customerId = uuidv4();
    customerIds.push(customerId);
    insertCustomer.run(customerId, cust.code, cust.first_name, cust.last_name, cust.email, cust.phone, cust.city, cust.type, cust.level, cust.points, 1);
  });

  // Create suppliers
  const supplierIds = [];
  const supplierData = [
    { code: 'SUPP001', name: 'TechWorld Distributors', email: 'tech@techworld.pk', phone: '+92-51-1234567', city: 'Rawalpindi', notes: 'Electronics' },
    { code: 'SUPP002', name: 'Fashion Hub Wholesale', email: 'info@fashionhub.pk', phone: '+92-42-2345678', city: 'Lahore', notes: 'Clothing' },
    { code: 'SUPP003', name: 'FoodMart Distributors', email: 'orders@foodmart.pk', phone: '+92-21-3456789', city: 'Karachi', notes: 'Groceries' },
    { code: 'SUPP004', name: 'Apple Pakistan', email: 'apple@apple.pk', phone: '+92-51-4567890', city: 'Islamabad', notes: 'Electronics' },
    { code: 'SUPP005', name: 'Nike Pakistan', email: 'nike@nike.pk', phone: '+92-42-5678901', city: 'Lahore', notes: 'Sportswear' }
  ];
  const insertSupplier = db.prepare(`
    INSERT INTO suppliers (id, code, name, email, phone, city, notes, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  supplierData.forEach(supp => {
    const supplierId = uuidv4();
    supplierIds.push(supplierId);
    insertSupplier.run(supplierId, supp.code, supp.name, supp.email, supp.phone, supp.city, supp.notes, 1);
  });

  // Create accounts (capture IDs for transactions)
  const cashAccountId = uuidv4();
  const bankAccountId = uuidv4();
  const arAccountId = uuidv4();
  const invAccountId = uuidv4();
  const apAccountId = uuidv4();
  const ccAccountId = uuidv4();
  const revenueAccountId = uuidv4();
  const cogsAccountId = uuidv4();
  const expenseAccountId = uuidv4();

  const accountData = [
    { id: cashAccountId, account_number: '1000', name: 'Cash', type: 'asset', subtype: 'cash', opening_balance: 0 },
    { id: bankAccountId, account_number: '1100', name: 'Bank Accounts', type: 'asset', subtype: 'bank', opening_balance: 0 },
    { id: arAccountId, account_number: '1200', name: 'Accounts Receivable', type: 'asset', subtype: 'receivable', opening_balance: 0 },
    { id: invAccountId, account_number: '1500', name: 'Inventory', type: 'asset', subtype: 'inventory', opening_balance: 0 },
    { id: apAccountId, account_number: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'payable', opening_balance: 0 },
    { id: ccAccountId, account_number: '2100', name: 'Credit Cards', type: 'liability', subtype: 'credit_card', opening_balance: 0 },
    { id: revenueAccountId, account_number: '3000', name: 'Sales Revenue', type: 'revenue', subtype: 'sales', opening_balance: 0 },
    { id: cogsAccountId, account_number: '4000', name: 'Cost of Goods Sold', type: 'expense', subtype: 'cogs', opening_balance: 0 },
    { id: expenseAccountId, account_number: '5000', name: 'Operating Expenses', type: 'expense', subtype: 'operating', opening_balance: 0 }
  ];

  const insertAccount = db.prepare(`
    INSERT INTO accounts (id, account_number, name, type, subtype, opening_balance, is_system)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  accountData.forEach(acc => insertAccount.run(acc.id, acc.account_number, acc.name, acc.type, acc.subtype, acc.opening_balance, 1));

  // Create expense categories
  const expenseCategories = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Supplies', 'Maintenance', 'Insurance', 'Travel', 'Professional Services', 'Other'];
  const insertExpenseCat = db.prepare('INSERT INTO expense_categories (id, name, description) VALUES (?, ?, ?)');
  expenseCategories.forEach(cat => insertExpenseCat.run(uuidv4(), cat, `${cat} expenses`));

  // Create settings
  const settingsData = [
    { key: 'business_name', value: 'Enterprise POS', type: 'string' },
    { key: 'business_phone', value: '+1 234 567 8900', type: 'string' },
    { key: 'business_email', value: 'info@enterprise-pos.com', type: 'string' },
    { key: 'business_address', value: '123 Business Street, New York, NY 10001', type: 'string' },
    { key: 'default_currency', value: 'USD', type: 'string' },
    { key: 'default_language', value: 'en', type: 'string' },
    { key: 'tax_rate', value: '10', type: 'number' },
    { key: 'tax_method', value: 'inclusive', type: 'string' },
    { key: 'invoice_prefix', value: 'INV', type: 'string' },
    { key: 'invoice_footer', value: 'Thank you for your business!', type: 'string' },
    { key: 'auto_backup', value: 'true', type: 'boolean' },
    { key: 'backup_path', value: '', type: 'string' }
  ];

  const insertSetting = db.prepare('INSERT INTO settings (id, key, value, type) VALUES (?, ?, ?, ?)');
  settingsData.forEach(setting => insertSetting.run(uuidv4(), setting.key, setting.value, setting.type));

  // Create employees
  const employeeIds = [];
  const employeeData = [
    { code: 'EMP001', first_name: 'Zara', last_name: 'Hussain', email: 'zara.h@enterprise.com', phone: '+92-300-1111111', designation: 'Branch Manager', department: 'Management', salary: 65000, active: 1 },
    { code: 'EMP002', first_name: 'Kamran', last_name: 'Ali', email: 'kamran.a@enterprise.com', phone: '+92-300-2222222', designation: 'Senior Cashier', department: 'Sales', salary: 35000, active: 1 },
    { code: 'EMP003', first_name: 'Nadia', last_name: 'Pervaiz', email: 'nadia.p@enterprise.com', phone: '+92-300-3333333', designation: 'Inventory Manager', department: 'Inventory', salary: 45000, active: 1 },
    { code: 'EMP004', first_name: 'Tariq', last_name: 'Mehmood', email: 'tariq.m@enterprise.com', phone: '+92-300-4444444', designation: 'Accountant', department: 'Finance', salary: 50000, active: 1 },
    { code: 'EMP005', first_name: 'Sana', last_name: 'Iqbal', email: 'sana.i@enterprise.com', phone: '+92-300-5555555', designation: 'HR Officer', department: 'HR', salary: 40000, active: 0 },
    { code: 'EMP006', first_name: 'Rahul', last_name: 'Sharma', email: 'rahul.s@enterprise.com', phone: '+92-300-6666666', designation: 'Junior Cashier', department: 'Sales', salary: 28000, active: 0 }
  ];
  const insertEmployee = db.prepare(`
    INSERT INTO employees (id, employee_code, first_name, last_name, email, phone, designation, department, salary, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  employeeData.forEach(emp => {
    const employeeId = uuidv4();
    employeeIds.push(employeeId);
    insertEmployee.run(employeeId, emp.code, emp.first_name, emp.last_name, emp.email, emp.phone, emp.designation, emp.department, emp.salary, emp.active);
  });

  // Create sales (May 25-31 2026)
  const usersForSales = [adminUserId, managerUserId, cashierUserId];
  const today = new Date();
  const daysBase = [6, 6, 5, 4, 3, 2, 2, 1, 1, 0];
  const paymentMethods = ['cash', 'card', 'cash', 'cash', 'card', 'cash', 'card', 'card', 'cash', 'card'];
  const saleConfigs = [
    { customerIdx: 0, userIdx: 0, items: [[0,2,999],[3,1,1299],[5,2,150]] },
    { customerIdx: 1, userIdx: 1, items: [[2,2,349],[4,1,1099]] },
    { customerIdx: null, userIdx: 2, items: [[6,3,180],[7,10,18],[8,5,18]] },
    { customerIdx: null, userIdx: 0, items: [[1,1,899],[5,4,150]] },
    { customerIdx: 2, userIdx: 1, items: [[0,1,999],[7,5,18],[9,5,12]] },
    { customerIdx: 3, userIdx: 2, items: [[5,3,150],[8,8,18]] },
    { customerIdx: null, userIdx: 0, items: [[3,1,1299],[6,2,180],[7,4,18],[9,3,12]] },
    { customerIdx: 4, userIdx: 1, items: [[2,1,349],[4,1,1099],[5,1,150]] },
    { customerIdx: null, userIdx: 2, items: [[1,1,899],[7,10,18]] },
    { customerIdx: 5, userIdx: 0, items: [[4,1,1099],[6,2,180],[9,6,12]] }
  ];

  const insertSale = db.prepare(`
    INSERT INTO sales (id, reference, customer_id, user_id, warehouse_id, branch_id, status, sub_total, total_discount, total_tax, grand_total, paid_amount, due_amount, payment_method, sale_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSaleItem = db.prepare(`
    INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, discount_amount, discount_percentage, tax_rate, tax_amount, subtotal, product_name, product_sku)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSalePayment = db.prepare(`
    INSERT INTO sale_payments (id, sale_id, payment_method, amount)
    VALUES (?, ?, ?, ?)
  `);

  saleConfigs.forEach((cfg, i) => {
    const saleId = uuidv4();
    const saleDate = new Date(today.getTime() - daysBase[i] * 86400000);
    const dateStr = saleDate.toISOString().split('T')[0];
    const reference = `SALE-${dateStr.replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`;
    const customerId = cfg.customerIdx !== null ? customerIds[cfg.customerIdx] : null;
    const userId = usersForSales[cfg.userIdx];

    let subTotal = 0;
    cfg.items.forEach(([pIdx, qty, price]) => {
      subTotal += qty * price;
    });
    const tax = Math.round(subTotal * 0.1 * 100) / 100;
    const grandTotal = subTotal + tax;

    const timestamp = `${dateStr}T${String(saleDate.getHours()).padStart(2, '0')}:${String(saleDate.getMinutes()).padStart(2, '0')}:00`;

    insertSale.run(saleId, reference, customerId, userId, mainWarehouseId, mainBranchId, 'completed', subTotal, 0, tax, grandTotal, grandTotal, 0, paymentMethods[i], dateStr, timestamp, timestamp);

    cfg.items.forEach(([pIdx, qty, price]) => {
      const itemId = uuidv4();
      const product = productData[pIdx];
      const lineTotal = qty * price;
      const lineTax = Math.round(lineTotal * 0.1 * 100) / 100;
      insertSaleItem.run(itemId, saleId, productIds[pIdx], qty, price, 0, 0, 10.00, lineTax, lineTotal, product.name, product.sku);
    });

    insertSalePayment.run(uuidv4(), saleId, paymentMethods[i], grandTotal);
  });

  // Create expenses
  const expenseData = [
    { reference: 'EXP-202605-001', category: 'Utilities', amount: 3500, description: 'Internet Bill', date: '2026-05-15', vendor: 'ISP Provider' },
    { reference: 'EXP-202605-002', category: 'Salaries', amount: 250000, description: 'Staff Salaries', date: '2026-05-28', vendor: 'HR Department' },
    { reference: 'EXP-202605-003', category: 'Supplies', amount: 8500, description: 'Office Supplies', date: '2026-05-20', vendor: 'Stationery Plus' },
    { reference: 'EXP-202605-004', category: 'Marketing', amount: 45000, description: 'Marketing Campaign', date: '2026-05-25', vendor: 'Digital Agency' },
    { reference: 'EXP-202605-005', category: 'Maintenance', amount: 12000, description: 'Equipment Maintenance', date: '2026-05-22', vendor: 'Tech Services' }
  ];
  const insertExpense = db.prepare(`
    INSERT INTO expenses (id, reference, category, amount, description, date, vendor, status, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  expenseData.forEach(exp => {
    try { insertExpense.run(uuidv4(), exp.reference, exp.category, exp.amount, exp.description, exp.date, exp.vendor, 'approved', adminUserId, `${exp.date}T10:00:00`); } catch(e) { log.warn('Expense insert error:', e.message); }
  });

  // Create purchases
  const purchaseData = [
    { reference: 'PO-202605-002', supplierIdx: 0, status: 'received', total: 7500, grandTotal: 7500, paidAmount: 7500, date: '2026-05-28', notes: 'iPhones x10' },
    { reference: 'PO-202605-003', supplierIdx: 1, status: 'pending', total: 1700, grandTotal: 1700, paidAmount: 0, date: '2026-05-30', notes: 'Nike shoes x20' },
    { reference: 'PO-202605-004', supplierIdx: 2, status: 'received', total: 850, grandTotal: 850, paidAmount: 850, date: '2026-05-29', notes: 'Beverages bulk' },
    { reference: 'PO-202605-005', supplierIdx: 3, status: 'ordered', total: 4750, grandTotal: 4750, paidAmount: 0, date: '2026-05-31', notes: 'MacBooks x5' }
  ];
  const insertPurchase = db.prepare(`
    INSERT INTO purchases (id, reference, supplier_id, warehouse_id, status, total, grand_total, paid_amount, due_amount, purchase_date, notes, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  purchaseData.forEach(p => {
    const due = p.grandTotal - p.paidAmount;
    try { insertPurchase.run(uuidv4(), p.reference, supplierIds[p.supplierIdx], mainWarehouseId, p.status, p.total, p.grandTotal, p.paidAmount, due, p.date, p.notes, adminUserId, `${p.date}T09:00:00`, `${p.date}T09:00:00`); } catch(e) { log.warn('Purchase insert error:', e.message); }
  });

  // Create activity logs
  const now = new Date();
  const logEntries = [
    { daysAgo: 6, userIdx: 0, action: 'User Login', entity: 'users', desc: 'Admin logged in' },
    { daysAgo: 6, userIdx: 1, action: 'User Login', entity: 'users', desc: 'Manager logged in' },
    { daysAgo: 5, userIdx: 2, action: 'User Login', entity: 'users', desc: 'Cashier logged in' },
    { daysAgo: 5, userIdx: 0, action: 'Product Added', entity: 'products', desc: 'Added 10 products to inventory' },
    { daysAgo: 4, userIdx: 1, action: 'Sale Completed', entity: 'sales', desc: 'Sale SALE-20260527-004 completed' },
    { daysAgo: 4, userIdx: 0, action: 'Customer Added', entity: 'customers', desc: 'Added Ahmed Khan as customer' },
    { daysAgo: 3, userIdx: 2, action: 'Sale Completed', entity: 'sales', desc: 'Sale SALE-20260528-005 completed' },
    { daysAgo: 3, userIdx: 1, action: 'Supplier Added', entity: 'suppliers', desc: 'Added TechWorld Distributors' },
    { daysAgo: 2, userIdx: 0, action: 'Purchase Ordered', entity: 'purchases', desc: 'PO-202605-002 created' },
    { daysAgo: 2, userIdx: 2, action: 'Sale Completed', entity: 'sales', desc: 'Sale SALE-20260529-006 completed' },
    { daysAgo: 1, userIdx: 1, action: 'Expense Recorded', entity: 'expenses', desc: 'Staff Salaries expense recorded' },
    { daysAgo: 1, userIdx: 0, action: 'User Login', entity: 'users', desc: 'Admin logged in' },
    { daysAgo: 0, userIdx: 1, action: 'Sale Completed', entity: 'sales', desc: 'Sale SALE-20260531-010 completed' },
    { daysAgo: 0, userIdx: 2, action: 'User Logout', entity: 'users', desc: 'Cashier logged out' },
    { daysAgo: 0, userIdx: 0, action: 'System Backup', entity: 'system', desc: 'Daily backup completed' }
  ];
  const insertLog = db.prepare(`
    INSERT INTO activity_logs (id, user_id, action, entity_type, new_values, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  logEntries.forEach(entry => {
    const logDate = new Date(now.getTime() - entry.daysAgo * 86400000);
    const ts = logDate.toISOString().replace('T', ' ').substring(0, 19);
    try { insertLog.run(uuidv4(), usersForSales[entry.userIdx], entry.action, entry.entity, entry.desc, ts); } catch(e) { log.warn('Activity log insert error:', e.message); }
  });

  // Create notifications
  const notifData = [
    { userIdx: 0, type: 'stock_alert', title: 'Low Stock Alert', message: 'Nike Air Max 270 stock is below threshold. Current stock: 8, Minimum: 10' },
    { userIdx: 0, type: 'customer', title: 'New Customer Registered', message: 'Ahmed Khan has been registered as a new customer' },
    { userIdx: 1, type: 'purchase', title: 'Purchase Order Pending', message: 'Purchase order PO-202605-003 is pending approval' },
    { userIdx: 0, type: 'achievement', title: 'Monthly Sales Target Achieved', message: 'Congratulations! Sales team has achieved the monthly target of $75,000' },
    { userIdx: 1, type: 'system', title: 'System Backup Completed', message: 'Automatic system backup completed successfully at 02:00 AM' }
  ];
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  notifData.forEach(notif => {
    const notifDate = new Date(now.getTime() - 1 * 86400000);
    const ts = notifDate.toISOString().replace('T', ' ').substring(0, 19);
    try { insertNotif.run(uuidv4(), usersForSales[notif.userIdx], notif.type, notif.title, notif.message, ts); } catch(e) { log.warn('Notification insert error:', e.message); }
  });

  // Create account transactions
  const txData = [
    { accountId: cashAccountId, type: 'deposit', amount: 150000, desc: 'Opening balance - Cash account', balanceAfter: 150000 },
    { accountId: bankAccountId, type: 'deposit', amount: 500000, desc: 'Opening balance - Bank account', balanceAfter: 500000 },
    { accountId: revenueAccountId, type: 'revenue', amount: 85000, desc: 'Monthly sales revenue', balanceAfter: 85000 },
    { accountId: expenseAccountId, type: 'expense', amount: 319000, desc: 'Monthly operating expenses', balanceAfter: -319000 }
  ];
  const insertTx = db.prepare(`
    INSERT INTO account_transactions (id, account_id, transaction_type, amount, balance_after, description, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  txData.forEach(tx => {
    try { insertTx.run(uuidv4(), tx.accountId, tx.type, tx.amount, tx.balanceAfter, tx.desc, adminUserId, '2026-05-31 08:00:00'); } catch(e) { log.warn('Account transaction insert error:', e.message); }
  });

  log.info('Initial data seeded successfully');
}

export { initDatabase, getDatabase };
