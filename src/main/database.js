import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import log from 'electron-log';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function createStatement(sql) {
  const statement = rawDb.prepare(sql);

  const getRow = () => {
    const values = statement.get ? statement.get() : [];
    const columns = statement.getColumnNames ? statement.getColumnNames() : [];
    const row = {};

    columns.forEach((column, index) => {
      row[column] = values[index];
    });

    return row;
  };

  return {
    run(...params) {
      statement.bind(params);
      const result = statement.step();
      statement.free();
      isDirty = true;
      saveDatabase();
      return result;
    },
    get(...params) {
      statement.bind(params);
      const hasRow = statement.step();
      const row = hasRow ? getRow() : undefined;
      statement.free();
      return row;
    },
    all(...params) {
      statement.bind(params);
      const rows = [];
      while (statement.step()) {
        rows.push(getRow());
      }
      statement.free();
      return rows;
    }
  };
}

async function initDatabase() {
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'enterprise_pos.db');
  log.info(`Initializing database at: ${dbPath}`);

  const SQL = await initSqlJs({
    locateFile: (filename) => path.join(__dirname, '../../node_modules/sql.js/dist', filename)
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

  const insertRole = db.prepare('INSERT INTO roles (id, name, description, permissions, is_system) VALUES (?, ?, ?, ?, ?)');
  roles.forEach(role => insertRole.run(role.id, role.name, role.description, role.permissions, role.is_system));

  // Create default admin user
  const adminRoleId = roles[0].id;
  const hashedPassword = await bcrypt.hash('admin123', 10);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, pin, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), 'admin@enterprise-pos.com', hashedPassword, 'System', 'Administrator', '+1234567890', adminRoleId, '1234', 1);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, pin, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), 'manager@enterprise-pos.com', hashedPassword, 'Branch', 'Manager', '+1234567891', roles[2].id, '2345', 1);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, pin, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), 'cashier@enterprise-pos.com', hashedPassword, 'POS', 'Cashier', '+1234567892', roles[3].id, '3456', 1);

  // Create default branch
  const mainBranchId = uuidv4();
  db.prepare(`
    INSERT INTO branches (id, name, code, address, city, country, is_main, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(mainBranchId, 'Main Store', 'HQ001', '123 Business Street', 'New York', 'USA', 1, 1);

  // Create default warehouse
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

  const insertUnit = db.prepare('INSERT INTO units (id, name, short_name, is_integer) VALUES (?, ?, ?, ?)');
  units.forEach(unit => insertUnit.run(unit.id, unit.name, unit.short_name, unit.is_integer));

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

  const insertCategory = db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)');
  categories.forEach(cat => insertCategory.run(cat.id, cat.name, cat.description));

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

  const insertBrand = db.prepare('INSERT INTO brands (id, name, description) VALUES (?, ?, ?)');
  brands.forEach(brand => insertBrand.run(brand.id, brand.name, brand.description));

  // Create demo products (using category/brand IDs directly to avoid index misalignment)
  const categoryIds = categories.map(c => c.id);
  const brandIds = brands.map(b => b.id);
  const unitPcsId = units[0].id;
  
  const productData = [
    { sku: 'ELEC001', barcode: '123456789001', name: 'Wireless Bluetooth Headphones', category_id: categoryIds[0], brand_id: brandIds[0], cost: 45.00, price: 89.99 },
    { sku: 'ELEC002', barcode: '123456789002', name: 'USB-C Charging Cable 2m', category_id: categoryIds[0], brand_id: brandIds[1], cost: 5.00, price: 15.99 },
    { sku: 'ELEC003', barcode: '123456789003', name: 'Smart Watch Pro', category_id: categoryIds[0], brand_id: brandIds[1], cost: 120.00, price: 249.99 },
    { sku: 'GROC001', barcode: '234567890001', name: 'Premium Coffee Beans 500g', category_id: categoryIds[1], brand_id: brandIds[5], cost: 8.00, price: 18.99 },
    { sku: 'GROC002', barcode: '234567890002', name: 'Organic Olive Oil 1L', category_id: categoryIds[1], brand_id: brandIds[7], cost: 12.00, price: 24.99 },
    { sku: 'FASH001', barcode: '345678901001', name: 'Running Shoes Air Max', category_id: categoryIds[2], brand_id: brandIds[3], cost: 65.00, price: 129.99 },
    { sku: 'FASH002', barcode: '345678901002', name: 'Classic Cotton T-Shirt', category_id: categoryIds[2], brand_id: brandIds[4], cost: 12.00, price: 34.99 },
    { sku: 'HOME001', barcode: '456789012001', name: 'LED Desk Lamp', category_id: categoryIds[3], brand_id: brandIds[2], cost: 18.00, price: 45.99 },
    { sku: 'HOME002', barcode: '456789012002', name: 'Ceramic Plant Pot Set', category_id: categoryIds[3], brand_id: null, cost: 15.00, price: 39.99 },
    { sku: 'HLTH001', barcode: '567890123001', name: 'Vitamin D3 Supplements 60ct', category_id: categoryIds[4], brand_id: null, cost: 10.00, price: 24.99 },
    { sku: 'SPRT001', barcode: '678901234001', name: 'Yoga Mat Premium', category_id: categoryIds[5], brand_id: null, cost: 20.00, price: 49.99 },
    { sku: 'BOOK001', barcode: '789012345001', name: 'Business Management Guide', category_id: categoryIds[6], brand_id: null, cost: 15.00, price: 34.99 },
    { sku: 'TOYS001', barcode: '890123456001', name: 'Building Blocks Set 500pc', category_id: categoryIds[7], brand_id: null, cost: 25.00, price: 59.99 }
  ];
  const insertProduct = db.prepare(`
    INSERT INTO products (id, sku, barcode, name, description, category_id, brand_id, unit_id, cost_price, selling_price, tax_rate, is_track_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertStock = db.prepare(`
    INSERT INTO stock (id, product_id, warehouse_id, quantity)
    VALUES (?, ?, ?, ?)
  `);

  productData.forEach(product => {
    const productId = uuidv4();
    insertProduct.run(
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
      10.00,
      1
    );

    const stockQty = Math.floor(Math.random() * 100) + 20;
    insertStock.run(uuidv4(), productId, mainWarehouseId, stockQty);
  });

  // Create demo customer
  db.prepare(`
    INSERT INTO customers (id, code, first_name, last_name, email, phone, customer_type, membership_level, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), 'CUST001', 'John', 'Doe', 'john.doe@email.com', '+1234567890', 'individual', 'gold', 1);

  // Create demo supplier
  db.prepare(`
    INSERT INTO suppliers (id, code, name, email, phone, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), 'SUPP001', 'Global Distributors Inc.', 'orders@globaldist.com', '+1234567891', 1);

  // Create default accounts
  const accountData = [
    { id: uuidv4(), account_number: '1000', name: 'Cash', type: 'asset', subtype: 'cash', opening_balance: 0 },
    { id: uuidv4(), account_number: '1100', name: 'Bank Accounts', type: 'asset', subtype: 'bank', opening_balance: 0 },
    { id: uuidv4(), account_number: '1200', name: 'Accounts Receivable', type: 'asset', subtype: 'receivable', opening_balance: 0 },
    { id: uuidv4(), account_number: '1500', name: 'Inventory', type: 'asset', subtype: 'inventory', opening_balance: 0 },
    { id: uuidv4(), account_number: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'payable', opening_balance: 0 },
    { id: uuidv4(), account_number: '2100', name: 'Credit Cards', type: 'liability', subtype: 'credit_card', opening_balance: 0 },
    { id: uuidv4(), account_number: '3000', name: 'Sales Revenue', type: 'revenue', subtype: 'sales', opening_balance: 0 },
    { id: uuidv4(), account_number: '4000', name: 'Cost of Goods Sold', type: 'expense', subtype: 'cogs', opening_balance: 0 },
    { id: uuidv4(), account_number: '5000', name: 'Operating Expenses', type: 'expense', subtype: 'operating', opening_balance: 0 }
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

  // Create default settings
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

  // Create demo employees
  const employeeData = [
    { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.j@enterprise.com', phone: '+1234567891', designation: 'Store Manager', department: 'Operations' },
    { first_name: 'Mike', last_name: 'Williams', email: 'mike.w@enterprise.com', phone: '+1234567892', designation: 'Sales Associate', department: 'Sales' },
    { first_name: 'Emily', last_name: 'Brown', email: 'emily.b@enterprise.com', phone: '+1234567893', designation: 'Cashier', department: 'Sales' },
    { first_name: 'David', last_name: 'Miller', email: 'david.m@enterprise.com', phone: '+1234567894', designation: 'Warehouse Supervisor', department: 'Warehouse' }
  ];

  const insertEmployee = db.prepare(`
    INSERT INTO employees (id, employee_code, first_name, last_name, email, phone, designation, department, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  employeeData.forEach(emp => insertEmployee.run(uuidv4(), `EMP${Math.random().toString(36).substr(2, 6).toUpperCase()}`, emp.first_name, emp.last_name, emp.email, emp.phone, emp.designation, emp.department, 1));

  log.info('Initial data seeded successfully');
}

export { initDatabase, getDatabase };
