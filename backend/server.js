const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Allow larger payloads for product images (base64) - 100MB in bytes
const BODY_LIMIT = 100 * 1024 * 1024;
app.use(express.json({ limit: BODY_LIMIT }));

// Very simple token implementation (NOT for production)
const FAKE_TOKEN = "test-token";

// Email transport (configure via environment variables)
// Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
let mailTransport = null;
if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendInvoiceEmail(invoice) {
  if (!mailTransport) {
    console.log("Email not configured; skipping invoice email. Set SMTP_* env vars to enable.");
    return;
  }

  const client = db.getClientById(invoice.client_id);
  const primaryRecipient =
    (client && client.email) || process.env.EMAIL_TO || process.env.EMAIL_FROM;
  if (!primaryRecipient) {
    console.log("No recipient email found for invoice", invoice.invoice_number);
    return;
  }

  // Optional company copy: if EMAIL_TO is set and is different from the
  // primary recipient, send a BCC to that address so the company inbox
  // always receives a copy of every invoice email.
  const companyCopy =
    process.env.EMAIL_TO && process.env.EMAIL_TO !== primaryRecipient
      ? process.env.EMAIL_TO
      : null;

  const subject = `Invoice ${invoice.invoice_number} - Total Rs. ${invoice.total.toFixed(2)}`;

  const lines = invoice.items
    .map(
      (it) =>
        `${it.item_name || ""} x ${it.quantity} @ Rs. ${it.unit_price?.toFixed?.(2) ?? it.unit_price} = Rs. ${it.line_total?.toFixed?.(2) ?? it.line_total}`
    )
    .join("\n");

  const textBody = [
    `Dear ${client?.name || "Customer"},`,
    "",
    `Thank you for your purchase. Here are the details for invoice ${invoice.invoice_number}:`,
    "",
    lines,
    "",
    `Subtotal: Rs. ${invoice.subtotal.toFixed(2)}`,
    `Discount: Rs. ${invoice.discount.toFixed(2)}`,
    `Tax: Rs. ${invoice.tax.toFixed(2)}`,
    `Total: Rs. ${invoice.total.toFixed(2)}`,
    "",
    "E-Billing System",
  ].join("\n");

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: primaryRecipient,
      subject,
      text: textBody,
    };

    if (companyCopy) {
      mailOptions.bcc = companyCopy;
    }

    await mailTransport.sendMail(mailOptions);
    console.log("Invoice email sent for", invoice.invoice_number, "to", primaryRecipient, "bcc:", companyCopy || "none");
  } catch (err) {
    console.error("Failed to send invoice email", err);
  }
}

async function sendInvoiceEmailToRecipient(invoice, recipientEmail) {
  if (!mailTransport) {
    throw new Error("Email not configured. Set SMTP_* environment variables.")
  }

  if (!recipientEmail) {
    throw new Error("Recipient email is required.")
  }

  const recipient = String(recipientEmail).trim()
  if (!recipient) {
    throw new Error("Recipient email is required.")
  }

  const subject = `Invoice ${invoice.invoice_number} - Total Rs. ${invoice.total.toFixed(2)}`

  const lines = (invoice.items || [])
    .map(
      (it) =>
        `${it.item_name || ""} x ${it.quantity} @ Rs. ${it.unit_price?.toFixed?.(2) ?? it.unit_price} = Rs. ${it.line_total?.toFixed?.(2) ?? it.line_total}`
    )
    .join("\n")

  const textBody = [
    "Invoice details:",
    "",
    `Invoice: ${invoice.invoice_number}`,
    `Date: ${invoice.date}`,
    `Client: ${invoice.client_name || "N/A"}`,
    "",
    lines,
    "",
    `Subtotal: Rs. ${invoice.subtotal.toFixed(2)}`,
    `Discount: Rs. ${invoice.discount.toFixed(2)}`,
    `Tax: Rs. ${invoice.tax.toFixed(2)}`,
    `Total: Rs. ${invoice.total.toFixed(2)}`,
    "",
    "E-Billing System",
  ].join("\n")

  await mailTransport.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipient,
    subject,
    text: textBody,
  })
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Auth routes
app.post("/api/auth/login", (req, res) => {
  const body = req.body || {};
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const user = db.getUserByUsernameAndPassword(username, password);
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const { password: _pw, ...userWithoutPassword } = user;

  res.json({
    token: FAKE_TOKEN,
    user: userWithoutPassword,
  });
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (token !== FAKE_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = db.getFirstUser();
  if (!user) return res.status(401).json({ error: "No user" });
  const { password: _pw, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Clients
app.get("/api/clients", authMiddleware, (req, res) => {
  const search = (req.query.search || "").toString().trim() || undefined;
  const result = db.getClients(search);
  res.json(result);
});

app.post("/api/clients", authMiddleware, (req, res) => {
  const data = req.body || {};
  if (!data.name || !data.client_id) {
    return res.status(400).json({ error: "client_id and name are required" });
  }

  const client = db.insertClient({
    client_id: data.client_id,
    name: data.name,
    email: data.email || "",
    phone: data.phone || "",
    address: data.address || "",
  });
  res.status(201).json(client);
});

app.put("/api/clients/:id", authMiddleware, (req, res) => {
  const data = req.body || {};
  if (!data.name || !data.client_id) {
    return res.status(400).json({ error: "client_id and name are required" });
  }

  const existing = db.getClientById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Client not found" });
  }

  const updated = db.updateClient(req.params.id, {
    client_id: data.client_id,
    name: data.name,
    email: data.email || "",
    phone: data.phone || "",
    address: data.address || "",
  });

  res.json(updated);
});

// Items
app.get("/api/items", authMiddleware, (req, res) => {
  const search = (req.query.search || "").toString().trim() || undefined;
  const result = db.getItems(search);
  res.json(result);
});

app.post("/api/items", authMiddleware, (req, res) => {
  try {
    const data = req.body || {};
    if (!data.item_code || !data.item_name) {
      return res.status(400).json({ error: "item_code and item_name are required" });
    }

    const item = db.insertItem({
      item_code: data.item_code,
      item_name: data.item_name,
      category: data.category || "General",
      unit_price: Number(data.unit_price) || 0,
      quantity: Number(data.quantity) || 0,
      reorder_level: Number(data.reorder_level) || 0,
      description: data.description || "",
      image: data.image || null,
    });
    res.status(201).json(item);
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ error: err.message || "Failed to save product" });
  }
});

app.put("/api/items/:id", authMiddleware, (req, res) => {
  try {
    const data = req.body || {};
    if (!data.item_code || !data.item_name) {
      return res.status(400).json({ error: "item_code and item_name are required" });
    }

    const existing = db.getItemById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Keep existing image when frontend doesn't send image field.
    const nextImage =
      Object.prototype.hasOwnProperty.call(data, "image")
        ? data.image || null
        : existing.image || null;

    const updated = db.updateItem(req.params.id, {
      item_code: data.item_code,
      item_name: data.item_name,
      category: data.category || "General",
      unit_price: Number(data.unit_price) || 0,
      quantity: Number(data.quantity) || 0,
      reorder_level: Number(data.reorder_level) || 0,
      description: data.description || "",
      image: nextImage,
    });
    res.json(updated);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: err.message || "Failed to update product" });
  }
});

// Invoices
app.get("/api/invoices", authMiddleware, (req, res) => {
  res.json(db.getInvoices());
});

app.get("/api/invoices/:id", authMiddleware, (req, res) => {
  const invoice = db.getInvoiceById(req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }
  res.json(invoice);
});

app.post("/api/invoices/:id/send-email", authMiddleware, async (req, res) => {
  try {
    const invoice = db.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const body = req.body || {};
    const recipient =
      (typeof body.email === "string" && body.email.trim()) ||
      process.env.EMAIL_TO ||
      process.env.EMAIL_FROM;

    if (!recipient) {
      return res.status(400).json({ error: "Recipient email is required." });
    }

    await sendInvoiceEmailToRecipient(invoice, recipient);
    return res.json({ success: true, sent_to: recipient });
  } catch (err) {
    console.error("Failed to send invoice email manually", err);
    return res.status(500).json({ error: err.message || "Failed to send email" });
  }
});

app.post("/api/invoices", authMiddleware, (req, res) => {
  const data = req.body || {};
  const nextId = db.getInvoiceCount() + 1;
  const id = String(nextId);
  const invoiceNumber = `INV-${id.padStart(4, "0")}`;

  const date = data.date || new Date().toISOString().slice(0, 10);
  const clients = db.getClients();
  const itemsList = db.getItems();
  const client = clients.find((c) => c.id === data.client_id) || null;

  const itemsWithDetails = (data.items || []).map((it) => {
    const item = itemsList.find((i) => i.id === it.item_id);
    const qty = it.quantity || 0;
    const price = item ? item.unit_price : 0;
    const lineTotal = price * qty;
    return {
      ...it,
      item_name: item ? item.item_name : "Unknown Item",
      unit_price: price,
      line_total: lineTotal,
    };
  });

  const subtotal = itemsWithDetails.reduce((sum, it) => sum + (it.line_total || 0), 0);
  const discount = data.discount || 0;
  const tax = data.tax || 0;
  const total = subtotal - discount + tax;

  const invoice = {
    id,
    invoice_number: invoiceNumber,
    date,
    client_id: data.client_id,
    client_name: client ? client.name : "",
    items: itemsWithDetails,
    subtotal,
    discount,
    tax,
    total,
    status: data.status || "pending",
    payment_method: data.payment_method || "cash",
    cash_amount: data.cash_amount || null,
    cash_change: data.cash_change || null,
    cheque_number: data.cheque_number || "",
    cheque_bank: data.cheque_bank || "",
    cheque_date: data.cheque_date || "",
    cheque_amount: data.cheque_amount || null,
  };

  const inserted = db.insertInvoice(invoice);

  // Send email in background (do not block response)
  sendInvoiceEmail(inserted);

  res.status(201).json(inserted);
});

// Quotations
app.get("/api/quotations", authMiddleware, (req, res) => {
  res.json(db.getQuotations());
});

app.get("/api/quotations/:id", authMiddleware, (req, res) => {
  const quotation = db.getQuotationById(req.params.id);
  if (!quotation) {
    return res.status(404).json({ error: "Quotation not found" });
  }
  res.json(quotation);
});

app.post("/api/quotations", authMiddleware, (req, res) => {
  const data = req.body || {};
  const nextId = db.getQuotationCount() + 1;
  const id = String(nextId);
  const quotationNumber = `Q-${id.padStart(4, "0")}`;
  const date = data.date || new Date().toISOString().slice(0, 10);
  const clients = db.getClients();
  const itemsList = db.getItems();
  const client = clients.find((c) => c.id === data.client_id) || null;

  const itemsWithDetails = (data.items || []).map((it) => {
    const item = itemsList.find((i) => i.id === it.item_id);
    const qty = it.quantity || 0;
    const price = item ? item.unit_price : 0;
    const lineTotal = price * qty;
    return {
      ...it,
      item_name: item ? item.item_name : "Unknown Item",
      unit_price: price,
      line_total: lineTotal,
    };
  });

  const subtotal = itemsWithDetails.reduce((sum, it) => sum + (it.line_total || 0), 0);
  const discount = data.discount || 0;
  const tax = data.tax || 0;
  const total = subtotal - discount + tax;

  const quotation = {
    id,
    quotation_number: quotationNumber,
    date,
    client_id: data.client_id,
    client_name: client ? client.name : "",
    items: itemsWithDetails,
    subtotal,
    discount,
    tax,
    total,
    status: "pending",
  };

  const inserted = db.insertQuotation(quotation);
  res.status(201).json(inserted);
});

app.post("/api/quotations/:id/convert", authMiddleware, (req, res) => {
  const quotation = db.getQuotationById(req.params.id);
  if (!quotation) {
    return res.status(404).json({ error: "Quotation not found" });
  }

  const nextId = db.getInvoiceCount() + 1;
  const id = String(nextId);
  const invoiceNumber = `INV-${id.padStart(4, "0")}`;

  const invoice = {
    id,
    invoice_number: invoiceNumber,
    date: quotation.date,
    client_id: quotation.client_id,
    client_name: quotation.client_name,
    items: quotation.items,
    subtotal: quotation.subtotal,
    discount: quotation.discount,
    tax: quotation.tax,
    total: quotation.total,
    status: "pending",
  };

  const inserted = db.insertInvoice(invoice);
  db.updateQuotationStatus(quotation.id, "accepted");

  res.status(201).json({ invoice: inserted });
});

// Global error handler so frontend gets JSON (e.g. payload too large, parse errors)
app.use((err, req, res, next) => {
  console.error("Server error:", err.message || err);
  const isPayloadTooLarge =
    err.type === "entity.too.large" || err.message?.includes("too large") || err.status === 413;
  const status = isPayloadTooLarge ? 413 : err.status || 500;
  const message = isPayloadTooLarge
    ? `Request body too large (max ${BODY_LIMIT / 1024 / 1024}MB). Try a smaller image or paste an image URL instead.`
    : err.message || "Server error";
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log(`Body limit: ${BODY_LIMIT / 1024 / 1024}MB`);
});


