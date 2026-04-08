const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Use persistent path when available (e.g. Railway volume mounted at /data).
// Priority:
// 1) DB_PATH (full sqlite file path)
// 2) DATA_DIR (directory path, file name defaults to ebilling.sqlite)
// 3) local backend/data fallback (dev)
const defaultDataDir = path.join(__dirname, "data");
const configuredDataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : defaultDataDir;
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(configuredDataDir, "ebilling.sqlite");

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_code TEXT NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT,
    unit_price REAL,
    quantity INTEGER,
    reorder_level INTEGER,
    description TEXT,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL,
    date TEXT,
    client_id TEXT,
    client_name TEXT,
    items TEXT,
    subtotal REAL,
    discount REAL,
    tax REAL,
    total REAL,
    status TEXT,
    payment_method TEXT,
    cash_amount REAL,
    cash_change REAL,
    cheque_number TEXT,
    cheque_bank TEXT,
    cheque_date TEXT,
    cheque_amount REAL
  );

  CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_number TEXT NOT NULL,
    date TEXT,
    client_id TEXT,
    client_name TEXT,
    items TEXT,
    subtotal REAL,
    discount REAL,
    tax REAL,
    total REAL,
    status TEXT
  );
`);

// Seed default data if empty
const userCount = db.prepare("SELECT COUNT(*) as n FROM users").get();
if (userCount.n === 0) {
  db.prepare(
    "INSERT INTO users (username, password, email, name) VALUES (?, ?, ?, ?)"
  ).run("admin", "admin123", "admin@example.com", "Admin User");
}

const clientCount = db.prepare("SELECT COUNT(*) as n FROM clients").get();
if (clientCount.n === 0) {
  db.prepare(
    "INSERT INTO clients (client_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)"
  ).run("C001", "Default Client", "client@example.com", "1234567890", "123 Main Street");
}

const itemCount = db.prepare("SELECT COUNT(*) as n FROM items").get();
if (itemCount.n === 0) {
  db.prepare(
    "INSERT INTO items (item_code, item_name, category, unit_price, quantity, reorder_level, description) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run("ITM001", "Sample Item", "General", 100, 50, 5, "Sample stock item");
}

function rowToUser(row) {
  return {
    id: String(row.id),
    username: row.username,
    password: row.password,
    email: row.email || "",
    name: row.name || "",
  };
}

function rowToClient(row) {
  return {
    id: String(row.id),
    client_id: row.client_id,
    name: row.name,
    email: row.email || "",
    phone: row.phone || "",
    address: row.address || "",
  };
}

function rowToItem(row) {
  return {
    id: String(row.id),
    item_code: row.item_code,
    item_name: row.item_name,
    category: row.category || "General",
    unit_price: row.unit_price,
    quantity: row.quantity,
    reorder_level: row.reorder_level,
    description: row.description || "",
    image: row.image || null,
  };
}

function rowToInvoice(row) {
  let parsedItems = [];
  if (row.items) {
    try {
      const raw = JSON.parse(row.items);
      if (Array.isArray(raw)) {
        // Keep backward compatibility: some rows store line_total, UI expects total.
        parsedItems = raw.map((it) => ({
          ...it,
          total:
            it && it.total != null
              ? it.total
              : it && it.line_total != null
                ? it.line_total
                : 0,
        }));
      }
    } catch {
      parsedItems = [];
    }
  }

  return {
    id: String(row.id),
    invoice_number: row.invoice_number,
    date: row.date,
    client_id: row.client_id,
    client_name: row.client_name || "",
    items: parsedItems,
    subtotal: row.subtotal,
    discount: row.discount,
    tax: row.tax,
    total: row.total,
    status: row.status,
    payment_method: row.payment_method || "cash",
    cash_amount: row.cash_amount,
    cash_change: row.cash_change,
    cheque_number: row.cheque_number || "",
    cheque_bank: row.cheque_bank || "",
    cheque_date: row.cheque_date || "",
    cheque_amount: row.cheque_amount,
  };
}

function rowToQuotation(row) {
  return {
    id: String(row.id),
    quotation_number: row.quotation_number,
    date: row.date,
    client_id: row.client_id,
    client_name: row.client_name || "",
    items: row.items ? JSON.parse(row.items) : [],
    subtotal: row.subtotal,
    discount: row.discount,
    tax: row.tax,
    total: row.total,
    status: row.status,
  };
}

module.exports = {
  db,
  getUsers: () => db.prepare("SELECT * FROM users").all().map(rowToUser),
  getUserByUsernameAndPassword: (username, password) => {
    const row = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    return row ? rowToUser(row) : null;
  },
  getFirstUser: () => {
    const row = db.prepare("SELECT * FROM users LIMIT 1").get();
    return row ? rowToUser(row) : null;
  },

  getClients: (search) => {
    let rows = db.prepare("SELECT * FROM clients").all();
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.name && r.name.toLowerCase().includes(s)) ||
          (r.client_id && r.client_id.toLowerCase().includes(s))
      );
    }
    return rows.map(rowToClient);
  },
  getClientById: (id) => {
    const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
    return row ? rowToClient(row) : null;
  },
  insertClient: (client) => {
    const result = db
      .prepare(
        "INSERT INTO clients (client_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)"
      )
      .run(
        client.client_id,
        client.name,
        client.email || "",
        client.phone || "",
        client.address || ""
      );
    return { ...client, id: String(result.lastInsertRowid) };
  },
  updateClient: (id, client) => {
    db.prepare(
      "UPDATE clients SET client_id = ?, name = ?, email = ?, phone = ?, address = ? WHERE id = ?"
    ).run(
      client.client_id,
      client.name,
      client.email || "",
      client.phone || "",
      client.address || "",
      id
    );
    const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
    return row ? rowToClient(row) : null;
  },

  getItems: (search) => {
    let rows = db.prepare("SELECT * FROM items").all();
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.item_name && r.item_name.toLowerCase().includes(s)) ||
          (r.item_code && r.item_code.toLowerCase().includes(s))
      );
    }
    return rows.map(rowToItem);
  },
  getItemById: (id) => {
    const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id);
    return row ? rowToItem(row) : null;
  },
  insertItem: (item) => {
    const result = db
      .prepare(
        "INSERT INTO items (item_code, item_name, category, unit_price, quantity, reorder_level, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        item.item_code,
        item.item_name,
        item.category || "General",
        item.unit_price,
        item.quantity,
        item.reorder_level,
        item.description || "",
        item.image || null
      );
    return { ...item, id: String(result.lastInsertRowid) };
  },
  updateItem: (id, item) => {
    db.prepare(
      "UPDATE items SET item_code = ?, item_name = ?, category = ?, unit_price = ?, quantity = ?, reorder_level = ?, description = ?, image = ? WHERE id = ?"
    ).run(
      item.item_code,
      item.item_name,
      item.category || "General",
      item.unit_price,
      item.quantity,
      item.reorder_level,
      item.description || "",
      item.image || null,
      id
    );
    const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id);
    return row ? rowToItem(row) : null;
  },

  getInvoices: () => {
    const rows = db.prepare("SELECT * FROM invoices ORDER BY id DESC").all();
    return rows.map(rowToInvoice);
  },
  getInvoiceById: (id) => {
    const row = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
    return row ? rowToInvoice(row) : null;
  },
  getInvoiceCount: () => db.prepare("SELECT COUNT(*) as n FROM invoices").get().n,
  insertInvoice: (invoice) => {
    db.prepare(
      `INSERT INTO invoices (
        invoice_number, date, client_id, client_name, items, subtotal, discount, tax, total, status,
        payment_method, cash_amount, cash_change, cheque_number, cheque_bank, cheque_date, cheque_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      invoice.invoice_number,
      invoice.date,
      invoice.client_id,
      invoice.client_name || "",
      JSON.stringify(invoice.items),
      invoice.subtotal,
      invoice.discount,
      invoice.tax,
      invoice.total,
      invoice.status,
      invoice.payment_method || "cash",
      invoice.cash_amount,
      invoice.cash_change,
      invoice.cheque_number || "",
      invoice.cheque_bank || "",
      invoice.cheque_date || "",
      invoice.cheque_amount
    );
    const id = db.prepare("SELECT last_insert_rowid() as id").get().id;
    return { ...invoice, id: String(id) };
  },

  getQuotations: () => db.prepare("SELECT * FROM quotations").all().map(rowToQuotation),
  getQuotationById: (id) => {
    const row = db.prepare("SELECT * FROM quotations WHERE id = ?").get(id);
    return row ? rowToQuotation(row) : null;
  },
  getQuotationCount: () => db.prepare("SELECT COUNT(*) as n FROM quotations").get().n,
  insertQuotation: (quotation) => {
    db.prepare(
      `INSERT INTO quotations (quotation_number, date, client_id, client_name, items, subtotal, discount, tax, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      quotation.quotation_number,
      quotation.date,
      quotation.client_id,
      quotation.client_name || "",
      JSON.stringify(quotation.items),
      quotation.subtotal,
      quotation.discount,
      quotation.tax,
      quotation.total,
      quotation.status
    );
    const id = db.prepare("SELECT last_insert_rowid() as id").get().id;
    return { ...quotation, id: String(id) };
  },
  updateQuotationStatus: (id, status) => {
    db.prepare("UPDATE quotations SET status = ? WHERE id = ?").run(status, id);
  },
};
