const { dialog, app, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('./database');
const { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } = require('date-fns');

let mainWindowRef = null;

function setupIpcHandlers(ipcMain, store, mainWindow) {
  mainWindowRef = mainWindow;
  
  // ==================== AUTHENTICATION ====================
  ipcMain.handle('auth:login', async (event, { email, password, deviceId }) => {
    try {
      const db = getDatabase();
      const user = db.prepare(`
        SELECT u.*, r.name as role_name, r.permissions 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.email = ? AND u.is_active = 1
      `).get(email);

      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return { success: false, message: 'Account is temporarily locked. Try again later.' };
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isValid) {
        // Increment login attempts
        const attempts = user.login_attempts + 1;
        const locked = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null;
        
        db.prepare('UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?')
          .run(attempts, locked, user.id);
        
        return { success: false, message: 'Invalid credentials' };
      }

      // Reset login attempts on success
      db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = ? WHERE id = ?')
        .run(new Date().toISOString(), user.id);

      // Create session
      const sessionToken = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      db.prepare(`
        INSERT INTO user_sessions (id, user_id, token, device_id, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), user.id, sessionToken, deviceId, expiresAt);

      // Log activity
      logActivity(db, user.id, 'login', 'user', user.id);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role_name,
          permissions: JSON.parse(user.permissions || '[]'),
          avatar: user.avatar
        },
        token: sessionToken
      };
    } catch (error) {
      log.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  });

  ipcMain.handle('auth:pin-login', async (event, { pin }) => {
    try {
      const db = getDatabase();
      const user = db.prepare(`
        SELECT u.*, r.name as role_name, r.permissions 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.pin = ? AND u.is_active = 1
      `).get(pin);

      if (!user) {
        return { success: false, message: 'Invalid PIN' };
      }

      // Update last login
      db.prepare('UPDATE users SET last_login = ? WHERE id = ?')
        .run(new Date().toISOString(), user.id);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role_name,
          permissions: JSON.parse(user.permissions || '[]'),
          avatar: user.avatar
        }
      };
    } catch (error) {
      log.error('PIN login error:', error);
      return { success: false, message: 'PIN login failed' };
    }
  });

  ipcMain.handle('auth:logout', async (event, { token }) => {
    try {
      const db = getDatabase();
      const session = db.prepare('SELECT user_id FROM user_sessions WHERE token = ?').get(token);
      
      if (session) {
        logActivity(db, session.user_id, 'logout', 'user', session.user_id);
        db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
      }
      
      return { success: true };
    } catch (error) {
      log.error('Logout error:', error);
      return { success: false };
    }
  });

  ipcMain.handle('auth:get-current-user', async (event, { token }) => {
    try {
      const db = getDatabase();
      const session = db.prepare(`
        SELECT s.*, u.email, u.first_name, u.last_name, u.role_id, u.avatar,
               r.name as role_name, r.permissions
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        JOIN roles r ON u.role_id = r.id
        WHERE s.token = ? AND s.expires_at > ?
      `).get(token, new Date().toISOString());

      if (!session) {
        return { success: false, message: 'Session expired' };
      }

      return {
        success: true,
        user: {
          id: session.user_id,
          email: session.email,
          firstName: session.first_name,
          lastName: session.last_name,
          role: session.role_name,
          permissions: JSON.parse(session.permissions || '[]'),
          avatar: session.avatar
        }
      };
    } catch (error) {
      return { success: false, message: 'Session check failed' };
    }
  });

  // ==================== DASHBOARD ====================
  ipcMain.handle('dashboard:get-stats', async (event, { dateRange, branchId }) => {
    try {
      const db = getDatabase();
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Today's sales
      const todaySales = db.prepare(`
        SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count
        FROM sales WHERE DATE(sale_date) = ? AND status = 'completed'
      `).get(today);

      // Week sales
      const weekSales = db.prepare(`
        SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count
        FROM sales WHERE DATE(sale_date) >= ? AND status = 'completed'
      `).get(weekAgo);

      // Month sales
      const monthSales = db.prepare(`
        SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count
        FROM sales WHERE DATE(sale_date) >= ? AND status = 'completed'
      `).get(monthStart);

      // Today's profit
      const todayProfit = db.prepare(`
        SELECT COALESCE(SUM(s.grand_total - (si.quantity * p.cost_price)), 0) as profit
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN products p ON si.product_id = p.id
        WHERE DATE(s.sale_date) = ? AND s.status = 'completed'
      `).get(today);

      // Low stock products
      const lowStock = db.prepare(`
        SELECT COUNT(*) as count FROM stock s
        JOIN products p ON s.product_id = p.id
        WHERE s.quantity <= p.min_stock_level AND p.is_track_stock = 1
      `).get();

      // Today's customers
      const todayCustomers = db.prepare(`
        SELECT COUNT(DISTINCT customer_id) as count
        FROM sales WHERE DATE(sale_date) = ? AND customer_id IS NOT NULL
      `).get(today);

      // Recent sales
      const recentSales = db.prepare(`
        SELECT s.*, u.first_name || ' ' || u.last_name as user_name, c.first_name || ' ' || c.last_name as customer_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN customers c ON s.customer_id = c.id
        ORDER BY s.created_at DESC LIMIT 10
      `).all();

      // Top selling products (last 7 days)
      const topProducts = db.prepare(`
        SELECT si.product_name, si.product_sku, SUM(si.quantity) as total_qty, SUM(si.subtotal) as total_sales
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE DATE(s.sale_date) >= ? AND s.status = 'completed'
        GROUP BY si.product_id
        ORDER BY total_qty DESC
        LIMIT 10
      `).all(weekAgo);

      // Daily sales for chart (last 7 days)
      const dailySales = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const dayData = db.prepare(`
          SELECT COALESCE(SUM(grand_total), 0) as total
          FROM sales WHERE DATE(sale_date) = ? AND status = 'completed'
        `).get(date);
        dailySales.push({
          date: format(subDays(new Date(), i), 'MMM dd'),
          total: dayData.total
        });
      }

      // Expenses this month
      const monthExpenses = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses WHERE DATE(date) >= ?
      `).get(monthStart);

      return {
        success: true,
        stats: {
          todaySales: todaySales.total,
          todayOrders: todaySales.count,
          weekSales: weekSales.total,
          monthSales: monthSales.total,
          monthOrders: monthSales.count,
          profit: todayProfit.profit,
          lowStock: lowStock.count,
          newCustomers: todayCustomers.count,
          expenses: monthExpenses.total,
          recentSales,
          topProducts,
          dailySales
        }
      };
    } catch (error) {
      log.error('Dashboard stats error:', error);
      return { success: false, message: 'Failed to fetch dashboard stats' };
    }
  });

  // ==================== PRODUCTS ====================
  ipcMain.handle('products:get-all', async (event, { page, limit, search, category, brand, status }) => {
    try {
      const db = getDatabase();
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (category) {
        whereClause += ' AND p.category_id = ?';
        params.push(category);
      }
      if (brand) {
        whereClause += ' AND p.brand_id = ?';
        params.push(brand);
      }
      if (status !== undefined) {
        whereClause += ' AND p.is_active = ?';
        params.push(status);
      }

      const countResult = db.prepare(`SELECT COUNT(*) as total FROM products p ${whereClause}`).get(...params);
      
      const products = db.prepare(`
        SELECT p.*, c.name as category_name, b.name as brand_name,
               COALESCE((SELECT SUM(quantity) FROM stock WHERE product_id = p.id), 0) as stock_quantity
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      return {
        success: true,
        products,
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      };
    } catch (error) {
      log.error('Products fetch error:', error);
      return { success: false, message: 'Failed to fetch products' };
    }
  });

  ipcMain.handle('products:create', async (event, productData) => {
    try {
      const db = getDatabase();
      const id = uuidv4();
      
      db.prepare(`
        INSERT INTO products (id, sku, barcode, name, description, category_id, brand_id, unit_id,
                             cost_price, selling_price, wholesale_price, tax_rate, tax_method,
                             min_stock_level, max_stock_level, weight, is_track_stock, is_sellable, is_purchasable)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, productData.sku, productData.barcode, productData.name, productData.description,
        productData.category_id, productData.brand_id, productData.unit_id,
        productData.cost_price || 0, productData.selling_price || 0, productData.wholesale_price || 0,
        productData.tax_rate || 0, productData.tax_method || 'exclusive',
        productData.min_stock_level || 0, productData.max_stock_level || 0,
        productData.weight || 0, productData.is_track_stock ? 1 : 0, 
        productData.is_sellable ? 1 : 0, productData.is_purchasable ? 1 : 0
      );

      // Initialize stock if warehouse specified
      if (productData.warehouse_id) {
        db.prepare(`
          INSERT INTO stock (id, product_id, warehouse_id, quantity)
          VALUES (?, ?, ?, ?)
        `).run(uuidv4(), id, productData.warehouse_id, productData.initial_stock || 0);

        // Record stock movement
        db.prepare(`
          INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, reference_type, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), id, productData.warehouse_id, 'opening_stock', productData.initial_stock || 0, 'initial', 'Initial stock');
      }

      return { success: true, id };
    } catch (error) {
      log.error('Product create error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('products:update', async (event, { id, ...updates }) => {
    try {
      const db = getDatabase();
      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);
      
      db.prepare(`UPDATE products SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(...values, id);

      return { success: true };
    } catch (error) {
      log.error('Product update error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('products:delete', async (event, { id }) => {
    try {
      const db = getDatabase();
      db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('products:search', async (event, { query, limit = 20 }) => {
    try {
      const db = getDatabase();
      const products = db.prepare(`
        SELECT p.*, c.name as category_name,
               COALESCE((SELECT SUM(quantity) FROM stock WHERE product_id = p.id), 0) as stock_quantity
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?) AND p.is_active = 1 AND p.is_sellable = 1
        ORDER BY p.name ASC
        LIMIT ?
      `).all(`%${query}%`, `%${query}%`, `%${query}%`, limit);

      return { success: true, products };
    } catch (error) {
      return { success: false, products: [] };
    }
  });

  // ==================== SALES / POS ====================
  ipcMain.handle('sales:create', async (event, saleData) => {
    try {
      const db = getDatabase();
      const saleId = uuidv4();
      const reference = `INV${Date.now()}`;

      await db.prepare(`
        INSERT INTO sales (id, reference, customer_id, user_id, warehouse_id, branch_id, status,
                          sub_total, total_discount, total_tax, shipping_cost, grand_total,
                          paid_amount, due_amount, payment_method, coupon_discount, loyalty_points_earned,
                          notes, sale_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        saleId, reference, saleData.customer_id, saleData.user_id, saleData.warehouse_id,
        saleData.branch_id, 'completed', saleData.sub_total, saleData.total_discount || 0,
        saleData.total_tax, saleData.shipping_cost || 0, saleData.grand_total,
        saleData.paid_amount || saleData.grand_total, saleData.due_amount || 0,
        saleData.payment_method || 'cash', saleData.coupon_discount || 0,
        saleData.loyalty_points_earned || 0, saleData.notes, saleData.sale_date || new Date().toISOString()
      );

      // Insert sale items
      const insertItem = db.prepare(`
        INSERT INTO sale_items (id, sale_id, product_id, variant_id, warehouse_id, quantity,
                               unit_price, discount_amount, discount_percentage, tax_rate, tax_amount, subtotal,
                               product_name, product_sku)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of saleData.items) {
        insertItem.run(
          uuidv4(), saleId, item.product_id, item.variant_id, saleData.warehouse_id,
          item.quantity, item.unit_price, item.discount_amount || 0,
          item.discount_percentage || 0, item.tax_rate || 0, item.tax_amount || 0,
          item.subtotal, item.product_name, item.product_sku
        );

        // Update stock
        if (item.product_id) {
          const stockUpdate = db.prepare(`
            UPDATE stock SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ? AND warehouse_id = ?
          `);
          stockUpdate.run(item.quantity, item.product_id, saleData.warehouse_id);

          // Record stock movement
          db.prepare(`
            INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(uuidv4(), item.product_id, saleData.warehouse_id, 'sale', -item.quantity, 'sale', saleId);
        }
      }

      // Insert payment if partial or full
      if (saleData.payments && saleData.payments.length > 0) {
        const insertPayment = db.prepare(`
          INSERT INTO sale_payments (id, sale_id, payment_method, amount, reference_number, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        for (const payment of saleData.payments) {
          insertPayment.run(uuidv4(), saleId, payment.method, payment.amount, payment.reference, payment.notes);
        }
      }

      // Update customer wallet if credit used
      if (saleData.wallet_amount > 0 && saleData.customer_id) {
        db.prepare(`
          UPDATE customers SET wallet_balance = wallet_balance - ? WHERE id = ?
        `).run(saleData.wallet_amount, saleData.customer_id);
      }

      // Update customer loyalty points
      if (saleData.customer_id) {
        const pointsEarned = Math.floor(saleData.grand_total);
        db.prepare(`
          UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ?
        `).run(pointsEarned, saleData.customer_id);
      }

      return { success: true, saleId, reference };
    } catch (error) {
      log.error('Sale create error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('sales:get-all', async (event, { page, limit, dateFrom, dateTo, status, customer, user }) => {
    try {
      const db = getDatabase();
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (dateFrom) {
        whereClause += ' AND DATE(s.sale_date) >= ?';
        params.push(dateFrom);
      }
      if (dateTo) {
        whereClause += ' AND DATE(s.sale_date) <= ?';
        params.push(dateTo);
      }
      if (status) {
        whereClause += ' AND s.status = ?';
        params.push(status);
      }
      if (customer) {
        whereClause += ' AND s.customer_id = ?';
        params.push(customer);
      }
      if (user) {
        whereClause += ' AND s.user_id = ?';
        params.push(user);
      }

      const countResult = db.prepare(`SELECT COUNT(*) as total FROM sales s ${whereClause}`).get(...params);

      const sales = db.prepare(`
        SELECT s.*, u.first_name || ' ' || u.last_name as user_name,
               c.first_name || ' ' || c.last_name as customer_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN customers c ON s.customer_id = c.id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      return { success: true, sales, total: countResult.total };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('sales:get-by-id', async (event, { id }) => {
    try {
      const db = getDatabase();
      const sale = db.prepare(`
        SELECT s.*, u.first_name || ' ' || u.last_name as user_name,
               c.first_name || ' ' || c.last_name as customer_name,
               b.name as branch_name, w.name as warehouse_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN branches b ON s.branch_id = b.id
        LEFT JOIN warehouses w ON s.warehouse_id = w.id
        WHERE s.id = ?
      `).get(id);

      if (!sale) return { success: false, message: 'Sale not found' };

      const items = db.prepare(`
        SELECT si.*, p.image as product_image
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `).all(id);

      const payments = db.prepare('SELECT * FROM sale_payments WHERE sale_id = ?').all(id);

      return { success: true, sale, items, payments };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ==================== CUSTOMERS ====================
  ipcMain.handle('customers:get-all', async (event, { page, limit, search }) => {
    try {
      const db = getDatabase();
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      const countResult = db.prepare(`SELECT COUNT(*) as total FROM customers ${whereClause}`).get(...params);

      const customers = db.prepare(`
        SELECT c.*, cg.name as group_name
        FROM customers c
        LEFT JOIN customer_groups cg ON c.customer_group_id = cg.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      return { success: true, customers, total: countResult.total };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('customers:create', async (event, customerData) => {
    try {
      const db = getDatabase();
      const id = uuidv4();
      const code = `CUST${Date.now().toString().slice(-6)}`;

      db.prepare(`
        INSERT INTO customers (id, code, first_name, last_name, email, phone, company, address,
                             city, state, country, postal_code, customer_type, credit_limit,
                             wallet_balance, loyalty_points, membership_level, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, code, customerData.first_name, customerData.last_name, customerData.email,
        customerData.phone, customerData.company, customerData.address, customerData.city,
        customerData.state, customerData.country, customerData.postal_code,
        customerData.customer_type || 'individual', customerData.credit_limit || 0,
        customerData.wallet_balance || 0, customerData.loyalty_points || 0,
        customerData.membership_level || 'standard', 1
      );

      return { success: true, id, code };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('customers:update-wallet', async (event, { customerId, amount, type, description }) => {
    try {
      const db = getDatabase();
      const id = uuidv4();

      if (type === 'credit') {
        db.prepare('UPDATE customers SET wallet_balance = wallet_balance + ? WHERE id = ?').run(amount, customerId);
      } else {
        db.prepare('UPDATE customers SET wallet_balance = wallet_balance - ? WHERE id = ?').run(amount, customerId);
      }

      const balance = db.prepare('SELECT wallet_balance FROM customers WHERE id = ?').get(customerId);

      db.prepare(`
        INSERT INTO customer_wallet_transactions (id, customer_id, type, amount, description, balance_after)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, customerId, type, amount, description, balance.wallet_balance);

      return { success: true, newBalance: balance.wallet_balance };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ==================== SUPPLIERS ====================
  ipcMain.handle('suppliers:get-all', async (event, { page, limit, search }) => {
    try {
      const db = getDatabase();
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const countResult = db.prepare(`SELECT COUNT(*) as total FROM suppliers ${whereClause}`).get(...params);

      const suppliers = db.prepare(`
        SELECT * FROM suppliers ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      return { success: true, suppliers, total: countResult.total };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('suppliers:create', async (event, supplierData) => {
    try {
      const db = getDatabase();
      const id = uuidv4();
      const code = `SUPP${Date.now().toString().slice(-6)}`;

      db.prepare(`
        INSERT INTO suppliers (id, code, name, company, email, phone, address, city, state,
                              country, postal_code, tax_number, website, opening_balance, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, code, supplierData.name, supplierData.company, supplierData.email,
        supplierData.phone, supplierData.address, supplierData.city, supplierData.state,
        supplierData.country, supplierData.postal_code, supplierData.tax_number,
        supplierData.website, supplierData.opening_balance || 0, 1
      );

      return { success: true, id, code };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ==================== PURCHASES ====================
  ipcMain.handle('purchases:create', async (event, purchaseData) => {
    try {
      const db = getDatabase();
      const purchaseId = uuidv4();
      const reference = `PO${Date.now()}`;

      db.prepare(`
        INSERT INTO purchases (id, reference, supplier_id, warehouse_id, status, total, discount_amount,
                               tax_amount, grand_total, purchase_date, due_date, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        purchaseId, reference, purchaseData.supplier_id, purchaseData.warehouse_id,
        'received', purchaseData.total || 0, purchaseData.discount_amount || 0,
        purchaseData.tax_amount || 0, purchaseData.grand_total, purchaseData.purchase_date,
        purchaseData.due_date, purchaseData.notes, purchaseData.user_id
      );

      // Insert purchase items and update stock
      for (const item of purchaseData.items) {
        const itemId = uuidv4();
        db.prepare(`
          INSERT INTO purchase_items (id, purchase_id, product_id, variant_id, warehouse_id, quantity,
                                     received_quantity, unit_price, discount_amount, tax_rate, tax_amount, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          itemId, purchaseId, item.product_id, item.variant_id, purchaseData.warehouse_id,
          item.quantity, item.quantity, item.unit_price, item.discount_amount || 0,
          item.tax_rate || 0, item.tax_amount || 0, item.subtotal
        );

        // Update stock
        db.prepare(`
          INSERT INTO stock (id, product_id, warehouse_id, quantity)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(product_id, warehouse_id) 
          DO UPDATE SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
        `).run(uuidv4(), item.product_id, purchaseData.warehouse_id, item.quantity, item.quantity);

        // Record stock movement
        db.prepare(`
          INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), item.product_id, purchaseData.warehouse_id, 'purchase', item.quantity, 'purchase', purchaseId);
      }

      return { success: true, purchaseId, reference };
    } catch (error) {
      log.error('Purchase create error:', error);
      return { success: false, message: error.message };
    }
  });

  // ==================== INVENTORY / STOCK ====================
  ipcMain.handle('inventory:get-stock', async (event, { page, limit, warehouse, category, search }) => {
    try {
      const db = getDatabase();
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (warehouse) {
        whereClause += ' AND s.warehouse_id = ?';
        params.push(warehouse);
      }
      if (category) {
        whereClause += ' AND p.category_id = ?';
        params.push(category);
      }
      if (search) {
        whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const countResult = db.prepare(`
        SELECT COUNT(*) as total FROM stock s
        JOIN products p ON s.product_id = p.id
        ${whereClause}
      `).get(...params);

      const stock = db.prepare(`
        SELECT s.*, p.name, p.sku, p.barcode, p.image, p.cost_price, p.selling_price,
               p.min_stock_level, c.name as category_name, w.name as warehouse_name,
               (p.selling_price * s.quantity) as stock_value
        FROM stock s
        JOIN products p ON s.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN warehouses w ON s.warehouse_id = w.id
        ${whereClause}
        ORDER BY p.name ASC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      return { success: true, stock, total: countResult.total };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('inventory:adjust-stock', async (event, { productId, warehouseId, quantity, type, reason }) => {
    try {
      const db = getDatabase();
      const id = uuidv4();

      // Update stock
      const adjustment = type === 'add' ? quantity : -quantity;
      db.prepare(`
        INSERT INTO stock (id, product_id, warehouse_id, quantity)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(product_id, warehouse_id)
        DO UPDATE SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
      `).run(uuidv4(), productId, warehouseId, type === 'add' ? 0 : 0, adjustment);

      // Record movement
      db.prepare(`
        INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, productId, warehouseId, type === 'add' ? 'adjustment_in' : 'adjustment_out',
             type === 'add' ? quantity : -quantity, reason);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('inventory:transfer', async (event, transferData) => {
    try {
      const db = getDatabase();
      const transferId = uuidv4();
      const reference = `TRF${Date.now()}`;

      db.prepare(`
        INSERT INTO transfers (id, reference, from_warehouse_id, to_warehouse_id, status, items, total_items, notes)
        VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
      `).run(transferId, reference, transferData.from_warehouse_id, transferData.to_warehouse_id,
             JSON.stringify(transferData.items), transferData.items.length, transferData.notes);

      // Update stock for each item
      for (const item of transferData.items) {
        db.prepare(`
          UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND warehouse_id = ?
        `).run(item.quantity, item.product_id, transferData.from_warehouse_id);

        db.prepare(`
          INSERT INTO stock (id, product_id, warehouse_id, quantity)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(product_id, warehouse_id)
          DO UPDATE SET quantity = quantity + ?
        `).run(uuidv4(), item.product_id, transferData.to_warehouse_id, item.quantity, item.quantity);

        db.prepare(`
          INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), item.product_id, transferData.from_warehouse_id, 'transfer_out', -item.quantity, 'transfer', transferId);
      }

      return { success: true, transferId, reference };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ==================== ACCOUNTS & EXPENSES ====================
  ipcMain.handle('accounts:get-all', async (event, { type }) => {
    try {
      const db = getDatabase();
      let whereClause = '';
      const params = [];

      if (type) {
        whereClause = 'WHERE type = ?';
        params.push(type);
      }

      const accounts = db.prepare(`
        SELECT * FROM accounts ${whereClause} ORDER BY account_number
      `).all(...params);

      return { success: true, accounts };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('expenses:create', async (event, expenseData) => {
    try {
      const db = getDatabase();
      const id = uuidv4();
      const reference = `EXP${Date.now()}`;

      db.prepare(`
        INSERT INTO expenses (id, reference, category, account_id, amount, description, date, vendor, payment_method, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, reference, expenseData.category, expenseData.account_id, expenseData.amount,
             expenseData.description, expenseData.date, expenseData.vendor, expenseData.payment_method, expenseData.user_id);

      // Update account balance
      if (expenseData.account_id) {
        db.prepare(`
          UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?
        `).run(expenseData.amount, expenseData.account_id);
      }

      return { success: true, id, reference };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('transactions:create', async (event, transactionData) => {
    try {
      const db = getDatabase();
      const id = uuidv4();
      const reference = `TXN${Date.now()}`;

      db.prepare(`
        INSERT INTO transactions (id, reference, date, description, type, amount, account_id, category, payment_method, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, reference, transactionData.date, transactionData.description, transactionData.type,
             transactionData.amount, transactionData.account_id, transactionData.category,
             transactionData.payment_method, transactionData.user_id);

      // Update account balance
      if (transactionData.account_id) {
        const adjustment = transactionData.type === 'income' ? transactionData.amount : -transactionData.amount;
        db.prepare(`
          UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?
        `).run(adjustment, transactionData.account_id);
      }

      return { success: true, id, reference };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ==================== EMPLOYEES ====================
  ipcMain.handle('employees:get-all', async (event, { page, limit, search }) => {
    try {
      const db = getDatabase();
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR employee_code LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const countResult = db.prepare(`SELECT COUNT(*) as total FROM employees ${whereClause}`).get(...params);

      const employees = db.prepare(`
        SELECT * FROM employees ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      return { success: true, employees, total: countResult.total };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('attendance:mark', async (event, { employeeId, checkIn, checkOut, status, remarks }) => {
    try {
      const db = getDatabase();
      const today = format(new Date(), 'yyyy-MM-dd');
      const id = uuidv4();

      // Check if already marked
      const existing = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(employeeId, today);

      if (existing) {
        db.prepare('UPDATE attendance SET check_out = ?, status = ?, remarks = ? WHERE id = ?')
          .run(checkOut, status, remarks, existing.id);
        return { success: true, message: 'Attendance updated' };
      }

      db.prepare(`
        INSERT INTO attendance (id, employee_id, date, check_in, check_out, status, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, employeeId, today, checkIn, checkOut, status, remarks);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ==================== CATEGORIES & BRANDS ====================
  ipcMain.handle('categories:get-all', async (event) => {
    try {
      const db = getDatabase();
      const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name').all();
      return { success: true, categories };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('brands:get-all', async (event) => {
    try {
      const db = getDatabase();
      const brands = db.prepare('SELECT * FROM brands WHERE is_active = 1 ORDER BY name').all();
      return { success: true, brands };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('warehouses:get-all', async (event) => {
    try {
      const db = getDatabase();
      const warehouses = db.prepare('SELECT * FROM warehouses WHERE is_active = 1 ORDER BY name').all();
      return { success: true, warehouses };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('units:get-all', async (event) => {
    try {
      const db = getDatabase();
      const units = db.prepare('SELECT * FROM units ORDER BY name').all();
      return { success: true, units };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ==================== REPORTS ====================
  ipcMain.handle('reports:sales', async (event, { dateFrom, dateTo, groupBy }) => {
    try {
      const db = getDatabase();
      
      let groupClause = groupBy === 'product' ? 'si.product_id' : 
                        groupBy === 'category' ? 'p.category_id' :
                        groupBy === 'user' ? 's.user_id' : 'DATE(s.sale_date)';

      let selectClause = groupBy === 'product' ? 'si.product_name as label' :
                         groupBy === 'category' ? 'c.name as label' :
                         groupBy === 'user' ? "u.first_name || ' ' || u.last_name as label" :
                         "DATE(s.sale_date) as label";

      const data = db.prepare(`
        SELECT ${selectClause}, COUNT(*) as total_orders, SUM(si.quantity) as total_qty,
               SUM(si.subtotal) as total_sales, SUM(si.subtotal * s.total_discount / NULLIF(s.sub_total, 0)) as total_discount
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE DATE(s.sale_date) BETWEEN ? AND ? AND s.status = 'completed'
        GROUP BY ${groupClause}
        ORDER BY total_sales DESC
      `).all(dateFrom, dateTo);

      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('reports:profit-loss', async (event, { dateFrom, dateTo }) => {
    try {
      const db = getDatabase();

      const sales = db.prepare(`
        SELECT COALESCE(SUM(grand_total), 0) as total FROM sales
        WHERE DATE(sale_date) BETWEEN ? AND ? AND status = 'completed'
      `).get(dateFrom, dateTo);

      const cogs = db.prepare(`
        SELECT COALESCE(SUM(si.quantity * p.cost_price), 0) as total
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN products p ON si.product_id = p.id
        WHERE DATE(s.sale_date) BETWEEN ? AND ? AND s.status = 'completed'
      `).get(dateFrom, dateTo);

      const expenses = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM expenses
        WHERE DATE(date) BETWEEN ? AND ?
      `).get(dateFrom, dateTo);

      return {
        success: true,
        data: {
          revenue: sales.total,
          cogs: cogs.total,
          grossProfit: sales.total - cogs.total,
          expenses: expenses.total,
          netProfit: sales.total - cogs.total - expenses.total
        }
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ==================== SETTINGS ====================
  ipcMain.handle('settings:get', async (event, { key }) => {
    try {
      const db = getDatabase();
      if (key) {
        const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
        return { success: true, setting };
      }
      const settings = db.prepare('SELECT * FROM settings').all();
      return { success: true, settings };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('settings:set', async (event, { key, value }) => {
    try {
      const db = getDatabase();
      db.prepare(`
        INSERT INTO settings (id, key, value, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
      `).run(uuidv4(), key, value, value);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ==================== RETURNS ====================
  ipcMain.handle('returns:create-sale-return', async (event, returnData) => {
    try {
      const db = getDatabase();
      const returnId = uuidv4();
      const reference = `RET${Date.now()}`;

      db.prepare(`
        INSERT INTO sales_returns (id, reference, sale_id, customer_id, reason, total, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(returnId, reference, returnData.sale_id, returnData.customer_id,
             returnData.reason, returnData.total, 'completed', returnData.user_id);

      // Update sale status
      db.prepare('UPDATE sales SET status = ? WHERE id = ?').run('returned', returnData.sale_id);

      // Return stock
      for (const item of returnData.items) {
        db.prepare(`
          UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = ?
        `).run(item.quantity, item.product_id, item.warehouse_id);

        db.prepare(`
          INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), item.product_id, item.warehouse_id, 'sale_return', item.quantity, 'return', returnId);
      }

      return { success: true, returnId, reference };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ==================== HELD ORDERS ====================
  ipcMain.handle('orders:hold', async (event, orderData) => {
    try {
      const db = getDatabase();
      const id = uuidv4();
      const reference = `HOLD${Date.now()}`;

      db.prepare(`
        INSERT INTO held_orders (id, reference, user_id, order_data, items_count, grand_total)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, reference, orderData.user_id, JSON.stringify(orderData), orderData.items.length, orderData.grand_total);

      return { success: true, id, reference };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('orders:get-held', async (event, { userId }) => {
    try {
      const db = getDatabase();
      const orders = db.prepare('SELECT * FROM held_orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
      return { success: true, orders };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('orders:recall-held', async (event, { id }) => {
    try {
      const db = getDatabase();
      const order = db.prepare('SELECT * FROM held_orders WHERE id = ?').get(id);
      if (order) {
        db.prepare('DELETE FROM held_orders WHERE id = ?').run(id);
        return { success: true, order: { ...order, order_data: JSON.parse(order.order_data) } };
      }
      return { success: false, message: 'Order not found' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ==================== FILE OPERATIONS ====================
  ipcMain.handle('dialog:open-file', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindowRef, options);
    return result;
  });

  ipcMain.handle('dialog:save-file', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindowRef, options);
    return result;
  });

  ipcMain.handle('shell:open-external', async (event, url) => {
    await shell.openExternal(url);
  });

  ipcMain.handle('app:get-path', async (event, name) => {
    return app.getPath(name);
  });

  ipcMain.handle('app:get-version', async () => {
    return app.getVersion();
  });

  // ==================== NOTIFICATIONS ====================
  ipcMain.handle('notifications:get', async (event, { userId, unreadOnly }) => {
    try {
      const db = getDatabase();
      let whereClause = '';
      if (unreadOnly) {
        whereClause = 'WHERE is_read = 0';
      }
      const notifications = db.prepare(`
        SELECT * FROM notifications ${whereClause}
        ORDER BY created_at DESC LIMIT 50
      `).all();
      return { success: true, notifications };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('notifications:mark-read', async (event, { id }) => {
    try {
      const db = getDatabase();
      db.prepare('UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  });

  ipcMain.handle('notifications:create', async (event, { userId, type, title, message, data }) => {
    try {
      const db = getDatabase();
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, data)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), userId, type, title, message, data);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  });

  // ==================== ACTIVITY LOGS ====================
  ipcMain.handle('logs:get-activity', async (event, { page, limit, userId, action }) => {
    try {
      const db = getDatabase();
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (userId) {
        whereClause += ' AND user_id = ?';
        params.push(userId);
      }
      if (action) {
        whereClause += ' AND action = ?';
        params.push(action);
      }

      const logs = db.prepare(`
        SELECT al.*, u.first_name || ' ' || u.last_name as user_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      return { success: true, logs };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  log.info('All IPC handlers registered successfully');
}

function logActivity(db, userId, action, entityType, entityId, oldValues = null, newValues = null) {
  try {
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(uuidv4(), userId, action, entityType, entityId, 
           oldValues ? JSON.stringify(oldValues) : null,
           newValues ? JSON.stringify(newValues) : null);
  } catch (error) {
    log.warn('Failed to log activity:', error.message);
  }
}

module.exports = { setupIpcHandlers };
