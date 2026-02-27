import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const db = new Database("pharmacy.db");
const JWT_SECRET = process.env.JWT_SECRET || "pharmacy-secret-key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT, -- admin, pharmacist, cashier
    full_name TEXT
  );

  CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_name TEXT,
    generic_name TEXT,
    strength TEXT,
    dosage_form TEXT,
    pack_size TEXT,
    barcode TEXT UNIQUE,
    manufacturer TEXT,
    salt_composition TEXT,
    storage_notes TEXT
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    contact_info TEXT,
    license_number TEXT,
    payment_terms TEXT
  );

  CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_id INTEGER,
    batch_number TEXT,
    expiry_date TEXT,
    mfg_date TEXT,
    purchase_rate REAL,
    mrp REAL,
    selling_rate REAL,
    tax_percent REAL,
    supplier_id INTEGER,
    purchase_id INTEGER,
    initial_qty INTEGER,
    current_qty INTEGER,
    FOREIGN KEY(medicine_id) REFERENCES medicines(id),
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY(purchase_id) REFERENCES purchases(id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_phone TEXT,
    total_amount REAL,
    tax_amount REAL,
    discount_amount REAL,
    payment_method TEXT,
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    batch_id INTEGER,
    quantity INTEGER,
    unit_price REAL,
    tax_amount REAL,
    discount_amount REAL,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(batch_id) REFERENCES batches(id)
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER,
    invoice_number TEXT,
    total_amount REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- 'expiry', 'low_stock'
    message TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed default settings
const expiryThreshold = db.prepare("SELECT * FROM settings WHERE key = ?").get("expiry_notification_days");
if (!expiryThreshold) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("expiry_notification_days", "30");
}

// Ensure purchase_id exists in batches (for existing databases)
try {
  db.exec("ALTER TABLE batches ADD COLUMN purchase_id INTEGER REFERENCES purchases(id)");
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS stock_adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER,
    type TEXT, -- damage, return, audit
    quantity INTEGER,
    reason TEXT,
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(batch_id) REFERENCES batches(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed Admin User if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run(
    "admin",
    hashedPassword,
    "admin",
    "System Administrator"
  );

  // Seed some medicines
  const m1 = db.prepare("INSERT INTO medicines (brand_name, generic_name, strength, dosage_form, pack_size, barcode, manufacturer) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    "Paracetamol", "Acetaminophen", "500mg", "Tablet", "10x10", "123456789", "HealthCorp"
  );
  const m2 = db.prepare("INSERT INTO medicines (brand_name, generic_name, strength, dosage_form, pack_size, barcode, manufacturer) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    "Amoxicillin", "Amoxicillin", "250mg", "Capsule", "10x10", "987654321", "BioPharma"
  );

  // Seed some suppliers
  const s1 = db.prepare("INSERT INTO suppliers (name, contact_info, license_number, payment_terms) VALUES (?, ?, ?, ?)").run(
    "Global Meds", "global@meds.com", "LIC-001", "Net 30"
  );

  // Seed some batches
  db.prepare(`
    INSERT INTO batches (medicine_id, batch_number, expiry_date, mfg_date, purchase_rate, mrp, selling_rate, tax_percent, supplier_id, initial_qty, current_qty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(m1.lastInsertRowid, "B-001", "2026-12-31", "2024-01-01", 10, 20, 18, 12, s1.lastInsertRowid, 100, 85);

  db.prepare(`
    INSERT INTO batches (medicine_id, batch_number, expiry_date, mfg_date, purchase_rate, mrp, selling_rate, tax_percent, supplier_id, initial_qty, current_qty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(m2.lastInsertRowid, "B-002", "2026-06-30", "2024-02-01", 50, 100, 90, 12, s1.lastInsertRowid, 50, 42);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Medicine Routes
  app.get("/api/medicines", authenticate, (req, res) => {
    const medicines = db.prepare("SELECT * FROM medicines").all();
    res.json(medicines);
  });

  app.post("/api/medicines", authenticate, (req, res) => {
    const { brand_name, generic_name, strength, dosage_form, pack_size, barcode, manufacturer, salt_composition, storage_notes } = req.body;
    const result = db.prepare(`
      INSERT INTO medicines (brand_name, generic_name, strength, dosage_form, pack_size, barcode, manufacturer, salt_composition, storage_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(brand_name, generic_name, strength, dosage_form, pack_size, barcode, manufacturer, salt_composition, storage_notes);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/medicines/:id", authenticate, (req, res) => {
    const { brand_name, generic_name, strength, dosage_form, pack_size, barcode, manufacturer, salt_composition, storage_notes } = req.body;
    db.prepare(`
      UPDATE medicines 
      SET brand_name = ?, generic_name = ?, strength = ?, dosage_form = ?, pack_size = ?, barcode = ?, manufacturer = ?, salt_composition = ?, storage_notes = ?
      WHERE id = ?
    `).run(brand_name, generic_name, strength, dosage_form, pack_size, barcode, manufacturer, salt_composition, storage_notes, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/medicines/:id", authenticate, (req, res) => {
    const batches: any = db.prepare("SELECT count(*) as count FROM batches WHERE medicine_id = ?").get(req.params.id);
    if (batches.count > 0) {
      return res.status(400).json({ error: "Cannot delete medicine with existing stock batches" });
    }
    db.prepare("DELETE FROM medicines WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Supplier Routes
  app.get("/api/suppliers", authenticate, (req, res) => {
    const suppliers = db.prepare("SELECT * FROM suppliers").all();
    res.json(suppliers);
  });

  app.post("/api/suppliers", authenticate, (req, res) => {
    const { name, contact_info, license_number, payment_terms } = req.body;
    const result = db.prepare("INSERT INTO suppliers (name, contact_info, license_number, payment_terms) VALUES (?, ?, ?, ?)").run(name, contact_info, license_number, payment_terms);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/suppliers/:id", authenticate, (req, res) => {
    const { name, contact_info, license_number, payment_terms } = req.body;
    db.prepare("UPDATE suppliers SET name = ?, contact_info = ?, license_number = ?, payment_terms = ? WHERE id = ?").run(name, contact_info, license_number, payment_terms, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/suppliers/:id", authenticate, (req, res) => {
    const batches: any = db.prepare("SELECT count(*) as count FROM batches WHERE supplier_id = ?").get(req.params.id);
    if (batches.count > 0) {
      return res.status(400).json({ error: "Cannot delete supplier with associated stock batches" });
    }
    db.prepare("DELETE FROM suppliers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/suppliers/:id/purchases", authenticate, (req, res) => {
    const purchases = db.prepare(`
      SELECT p.*, u.full_name as user_name
      FROM purchases p
      JOIN users u ON p.user_id = u.id
      WHERE p.supplier_id = ?
      ORDER BY p.timestamp DESC
    `).all(req.params.id);
    res.json(purchases);
  });

  app.get("/api/suppliers/:id/medicines", authenticate, (req, res) => {
    const medicines = db.prepare(`
      SELECT DISTINCT m.*
      FROM medicines m
      JOIN batches b ON m.id = b.medicine_id
      WHERE b.supplier_id = ?
    `).all(req.params.id);
    res.json(medicines);
  });

  // Inventory Routes
  app.get("/api/inventory", authenticate, (req, res) => {
    const inventory = db.prepare(`
      SELECT b.*, m.brand_name, m.generic_name, m.strength, s.name as supplier_name
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      WHERE b.current_qty > 0
      ORDER BY b.expiry_date ASC
    `).all();
    res.json(inventory);
  });

  app.post("/api/inventory/adjust", authenticate, (req: any, res) => {
    const { batch_id, type, quantity, reason } = req.body;
    const transaction = db.transaction(() => {
      const batch: any = db.prepare("SELECT current_qty FROM batches WHERE id = ?").get(batch_id);
      if (!batch) throw new Error("Batch not found");
      const newQty = batch.current_qty + quantity;
      if (newQty < 0) throw new Error("Adjustment results in negative stock");
      db.prepare("UPDATE batches SET current_qty = ? WHERE id = ?").run(newQty, batch_id);
      db.prepare(`
        INSERT INTO stock_adjustments (batch_id, type, quantity, reason, user_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(batch_id, type, quantity, reason, req.user.id);
    });
    try {
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/inventory/:id", authenticate, (req, res) => {
    const { expiry_date, mrp, selling_rate } = req.body;
    try {
      db.prepare(`
        UPDATE batches 
        SET expiry_date = ?, mrp = ?, selling_rate = ?
        WHERE id = ?
      `).run(expiry_date, mrp, selling_rate, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/inventory/all-adjustments", authenticate, (req, res) => {
    const adjustments = db.prepare(`
      SELECT sa.*, b.batch_number, m.brand_name, u.full_name as user_name
      FROM stock_adjustments sa
      JOIN batches b ON sa.batch_id = b.id
      JOIN medicines m ON b.medicine_id = m.id
      JOIN users u ON sa.user_id = u.id
      ORDER BY sa.timestamp DESC
    `).all();
    res.json(adjustments);
  });

  app.get("/api/inventory/:id/adjustments", authenticate, (req, res) => {
    const adjustments = db.prepare(`
      SELECT sa.*, u.full_name as user_name
      FROM stock_adjustments sa
      JOIN users u ON sa.user_id = u.id
      WHERE sa.batch_id = ?
      ORDER BY sa.timestamp DESC
    `).all(req.params.id);
    res.json(adjustments);
  });

  // POS Search
  app.get("/api/pos/search", authenticate, (req, res) => {
    const query = req.query.q;
    const results = db.prepare(`
      SELECT b.*, m.brand_name, m.generic_name, m.strength, m.dosage_form
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE (m.brand_name LIKE ? OR m.generic_name LIKE ? OR m.barcode = ?)
      AND b.current_qty > 0
      AND b.expiry_date > date('now')
      ORDER BY b.expiry_date ASC
    `).all(`%${query}%`, `%${query}%`, query);
    res.json(results);
  });

  // Sales Transaction
  app.post("/api/sales", authenticate, (req: any, res) => {
    const { customer_name, customer_phone, items, total_amount, tax_amount, discount_amount, payment_method } = req.body;
    
    const transaction = db.transaction(() => {
      const saleResult = db.prepare(`
        INSERT INTO sales (customer_name, customer_phone, total_amount, tax_amount, discount_amount, payment_method, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(customer_name, customer_phone, total_amount, tax_amount, discount_amount, payment_method, req.user.id);

      const saleId = saleResult.lastInsertRowid;

      for (const item of items) {
        // Check stock
        const batch: any = db.prepare("SELECT current_qty FROM batches WHERE id = ?").get(item.batch_id);
        if (!batch || batch.current_qty < item.quantity) {
          throw new Error(`Insufficient stock for batch ${item.batch_id}`);
        }

        // Update stock
        db.prepare("UPDATE batches SET current_qty = current_qty - ? WHERE id = ?").run(item.quantity, item.batch_id);

        // Record sale item
        db.prepare(`
          INSERT INTO sale_items (sale_id, batch_id, quantity, unit_price, tax_amount, discount_amount)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(saleId, item.batch_id, item.quantity, item.unit_price, item.tax_amount, item.discount_amount);
      }

      return saleId;
    });

    try {
      const saleId = transaction();
      res.json({ success: true, saleId });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Purchase Transaction
  app.post("/api/purchases", authenticate, (req: any, res) => {
    const { supplier_id, invoice_number, items, total_amount } = req.body;

    const transaction = db.transaction(() => {
      const purchaseResult = db.prepare(`
        INSERT INTO purchases (supplier_id, invoice_number, total_amount, user_id)
        VALUES (?, ?, ?, ?)
      `).run(supplier_id, invoice_number, total_amount, req.user.id);

      const purchaseId = purchaseResult.lastInsertRowid;

      for (const item of items) {
        // Add or update batch
        db.prepare(`
          INSERT INTO batches (medicine_id, batch_number, expiry_date, mfg_date, purchase_rate, mrp, selling_rate, tax_percent, supplier_id, purchase_id, initial_qty, current_qty)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          item.medicine_id,
          item.batch_number,
          item.expiry_date,
          item.mfg_date,
          item.purchase_rate,
          item.mrp,
          item.selling_rate,
          item.tax_percent,
          supplier_id,
          purchaseId,
          item.quantity,
          item.quantity
        );
      }

      return purchaseId;
    });

    try {
      const purchaseId = transaction();
      res.json({ success: true, purchaseId });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Sales History
  app.get("/api/sales", authenticate, (req, res) => {
    const sales = db.prepare(`
      SELECT s.*, u.full_name as user_name
      FROM sales s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.timestamp DESC
    `).all();
    res.json(sales);
  });

  // Purchase History
  app.get("/api/purchases", authenticate, (req, res) => {
    const purchases = db.prepare(`
      SELECT p.*, s.name as supplier_name, u.full_name as user_name
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN users u ON p.user_id = u.id
      ORDER BY p.timestamp DESC
    `).all();
    res.json(purchases);
  });

  app.get("/api/purchases/:id/items", authenticate, (req, res) => {
    const items = db.prepare(`
      SELECT b.*, m.brand_name, m.generic_name, m.strength
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.purchase_id = ?
    `).all(req.params.id);
    res.json(items);
  });

  // Reports
  app.get("/api/reports/sales", authenticate, (req, res) => {
    const sales = db.prepare(`
      SELECT date(timestamp) as date, SUM(total_amount) as total, COUNT(*) as count
      FROM sales
      GROUP BY date(timestamp)
      ORDER BY date DESC
      LIMIT 30
    `).all();
    res.json(sales);
  });

  app.get("/api/reports/expiry", authenticate, (req, res) => {
    const nearExpiry = db.prepare(`
      SELECT b.*, m.brand_name, m.generic_name
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.expiry_date <= date('now', '+90 days')
      AND b.current_qty > 0
      ORDER BY b.expiry_date ASC
    `).all();
    res.json(nearExpiry);
  });

  app.get("/api/reports/low-stock", authenticate, (req, res) => {
    const lowStock = db.prepare(`
      SELECT m.brand_name, SUM(b.current_qty) as total_qty
      FROM medicines m
      JOIN batches b ON m.id = b.medicine_id
      GROUP BY m.id
      HAVING total_qty < 50
    `).all();
    res.json(lowStock);
  });

  // Notifications API
  app.get("/api/notifications", authenticate, (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50").all();
    res.json(notifications);
  });

  app.post("/api/notifications/read-all", authenticate, (req, res) => {
    db.prepare("UPDATE notifications SET is_read = 1").run();
    res.json({ success: true });
  });

  // Settings API
  app.get("/api/settings", authenticate, (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post("/api/settings", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value.toString());
    res.json({ success: true });
  });

  // Trigger Notification Check (can be called manually or on dashboard load)
  app.post("/api/notifications/check", authenticate, (req, res) => {
    const threshold = parseInt(db.prepare("SELECT value FROM settings WHERE key = ?").get("expiry_notification_days")?.value || "30");
    
    const expiringBatches = db.prepare(`
      SELECT b.*, m.brand_name 
      FROM batches b 
      JOIN medicines m ON b.medicine_id = m.id 
      WHERE b.expiry_date <= date('now', '+' || ? || ' days')
      AND b.current_qty > 0
    `).all(threshold);

    for (const batch of expiringBatches as any[]) {
      const message = `Batch ${batch.batch_number} of ${batch.brand_name} is expiring on ${batch.expiry_date}`;
      // Check if notification already exists for this batch and message to avoid duplicates
      const exists = db.prepare("SELECT id FROM notifications WHERE message = ? AND is_read = 0").get(message);
      if (!exists) {
        db.prepare("INSERT INTO notifications (type, message) VALUES (?, ?)").run('expiry', message);
      }
    }

    res.json({ success: true, count: expiringBatches.length });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
