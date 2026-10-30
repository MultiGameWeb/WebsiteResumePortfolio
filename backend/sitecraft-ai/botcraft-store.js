// BotCraft storage in its own D1 database (binding BOTCRAFT_DB, database
// botcraft-db), separate from the website templates' sitecraft-db. Tables are
// created on first use, so no manual migration step is needed.

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS botcraft_shops (
    shop_id TEXT PRIMARY KEY,
    owner_id TEXT,
    shop_type TEXT NOT NULL DEFAULT '',
    shop_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    facts_json TEXT NOT NULL DEFAULT '{}',
    notes_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS botcraft_answers (
    shop_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (shop_id, question_id)
  )`,
  `CREATE TABLE IF NOT EXISTS botcraft_products (
    shop_id TEXT NOT NULL,
    name_key TEXT NOT NULL,
    name TEXT NOT NULL,
    price_text TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '',
    stock_status TEXT NOT NULL DEFAULT 'in_stock',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (shop_id, name_key)
  )`,
  `CREATE TABLE IF NOT EXISTS botcraft_builder_messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id TEXT NOT NULL,
    role TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_botcraft_messages_shop ON botcraft_builder_messages(shop_id, message_id)`,
  // Question banks generated on demand for shop types without a ready-made
  // file in botcraft-banks/; shared by every shop of that type.
  `CREATE TABLE IF NOT EXISTS botcraft_question_banks (
    shop_type_key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bank_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  // The id in the customer bot link and QR code. It is separate from shop_id,
  // which lets the owner's browser edit the setup and must stay private.
  `CREATE TABLE IF NOT EXISTS botcraft_public (
    public_id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  )`,
  // Photos live in D1 for now (no R2 yet); only this file reads or writes them,
  // so moving them to R2 later changes nothing else. kind: main (shop front /
  // business photo), owner, gallery, product (product_key = products.name_key).
  `CREATE TABLE IF NOT EXISTS botcraft_photos (
    photo_id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    product_key TEXT NOT NULL DEFAULT '',
    mime TEXT NOT NULL,
    data BLOB NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_botcraft_photos_shop ON botcraft_photos(shop_id, kind)`,
  // Customer questions the bot could not answer. The owner answers them on
  // the owner page (status answered, and the bot uses the answer) or
  // dismisses them. q_key groups the same question asked again.
  `CREATE TABLE IF NOT EXISTS botcraft_customer_questions (
    shop_id TEXT NOT NULL,
    q_key TEXT NOT NULL,
    question TEXT NOT NULL,
    product TEXT NOT NULL DEFAULT '',
    times INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'open',
    answer TEXT NOT NULL DEFAULT '',
    first_at TEXT NOT NULL,
    last_at TEXT NOT NULL,
    PRIMARY KEY (shop_id, q_key)
  )`,
  // Customer requests from the bot page: a photo with a question, or a
  // pre-order (kind photo / preorder; status new, accepted, ready, done or
  // rejected). Orders the owner tracks by bill number are kind order (status
  // received, in_progress, ready or delivered); customers look them up by code.
  // request_id is the customer's private key to their own request.
  `CREATE TABLE IF NOT EXISTS botcraft_requests (
    request_id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    code TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    pickup TEXT NOT NULL DEFAULT '',
    customer_name TEXT NOT NULL DEFAULT '',
    photo_id TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,
    reply TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_botcraft_requests_shop ON botcraft_requests(shop_id, kind, updated_at)`,
  // Owner settings that are not shop facts (which bot buttons are on).
  `CREATE TABLE IF NOT EXISTS botcraft_settings (
    shop_id TEXT PRIMARY KEY,
    settings_json TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL
  )`,
  // Web Push subscriptions: the owner's devices (role owner) and customers
  // waiting for the shop's reply to one of their requests (role customer).
  `CREATE TABLE IF NOT EXISTS botcraft_push_subs (
    endpoint TEXT NOT NULL,
    shop_id TEXT NOT NULL,
    role TEXT NOT NULL,
    request_id TEXT NOT NULL DEFAULT '',
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (endpoint, shop_id, role, request_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_botcraft_push_shop ON botcraft_push_subs(shop_id, role, request_id)`,
  // Server keys made once by the Worker (the VAPID key pair for Web Push).
  `CREATE TABLE IF NOT EXISTS botcraft_keys (
    name TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`
];

export const GALLERY_LIMIT = 10;
const SHOP_PHOTO_LIMIT = 500;

const MAX_NOTES = 200;
let schemaReady = null;

export function storeAvailable(env) {
  return Boolean(env?.BOTCRAFT_DB);
}

// Once per Worker isolate.
async function ensureSchema(db) {
  if (!schemaReady) {
    schemaReady = db.batch(SCHEMA.map(sql => db.prepare(sql))).catch(error => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

export async function loadShop(env, shopId, historyLimit) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const shop = await db.prepare("SELECT * FROM botcraft_shops WHERE shop_id = ?").bind(shopId).first();
  if (!shop) return null;
  const [answerRows, messageRows] = await Promise.all([
    db.prepare("SELECT question_id, value FROM botcraft_answers WHERE shop_id = ?").bind(shopId).all(),
    db.prepare("SELECT role, text, created_at FROM botcraft_builder_messages WHERE shop_id = ? ORDER BY message_id DESC LIMIT ?").bind(shopId, historyLimit).all()
  ]);
  return {
    facts: JSON.parse(shop.facts_json || "{}"),
    notes: JSON.parse(shop.notes_json || "[]"),
    answers: Object.fromEntries((answerRows.results || []).map(r => [r.question_id, r.value])),
    messages: (messageRows.results || []).reverse()
  };
}

export async function saveTurn(env, shopId, { facts, notes, answers, resetAnswers, items, ownerText, botText }) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const now = new Date().toISOString();
  const statements = [
    db.prepare(
      "INSERT INTO botcraft_shops (shop_id, shop_type, shop_name, facts_json, notes_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(shop_id) DO UPDATE SET shop_type = excluded.shop_type, shop_name = excluded.shop_name, facts_json = excluded.facts_json, notes_json = excluded.notes_json, updated_at = excluded.updated_at"
    ).bind(shopId, facts.shop_type || "", facts.shop_name || "", JSON.stringify(facts), JSON.stringify(notes.slice(-MAX_NOTES)), now, now)
  ];
  if (resetAnswers) statements.push(db.prepare("DELETE FROM botcraft_answers WHERE shop_id = ?").bind(shopId));
  for (const [questionId, value] of Object.entries(answers)) {
    statements.push(db.prepare(
      "INSERT INTO botcraft_answers (shop_id, question_id, value, updated_at) VALUES (?, ?, ?, ?) " +
      "ON CONFLICT(shop_id, question_id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
    ).bind(shopId, questionId, value, now));
  }
  for (const item of items) {
    statements.push(db.prepare(
      "INSERT INTO botcraft_products (shop_id, name_key, name, price_text, details, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(shop_id, name_key) DO UPDATE SET name = excluded.name, price_text = excluded.price_text, details = excluded.details, updated_at = excluded.updated_at"
    ).bind(shopId, item.name.toLowerCase().replace(/\s+/g, " ").trim(), item.name, item.price_text, item.details, now, now));
  }
  statements.push(
    db.prepare("INSERT INTO botcraft_builder_messages (shop_id, role, text, created_at) VALUES (?, 'owner', ?, ?)").bind(shopId, ownerText, now),
    db.prepare("INSERT INTO botcraft_builder_messages (shop_id, role, text, created_at) VALUES (?, 'botcraft', ?, ?)").bind(shopId, botText, now)
  );
  await db.batch(statements);
}

export async function loadStoredBank(env, key) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT bank_json FROM botcraft_question_banks WHERE shop_type_key = ?").bind(key).first();
  return row ? JSON.parse(row.bank_json) : null;
}

export async function saveStoredBank(env, record) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await db.prepare(
    "INSERT INTO botcraft_question_banks (shop_type_key, name, bank_json, created_at) VALUES (?, ?, ?, ?) " +
    "ON CONFLICT(shop_type_key) DO UPDATE SET name = excluded.name, bank_json = excluded.bank_json, created_at = excluded.created_at"
  ).bind(record.shop_type_key, record.name, JSON.stringify(record), new Date().toISOString()).run();
}

// The shop's public bot id, created the first time it is needed.
export async function ensurePublicId(env, shopId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const publicId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  await db.prepare("INSERT OR IGNORE INTO botcraft_public (public_id, shop_id, created_at) VALUES (?, ?, ?)")
    .bind(publicId, shopId, new Date().toISOString()).run();
  const row = await db.prepare("SELECT public_id FROM botcraft_public WHERE shop_id = ?").bind(shopId).first();
  return row?.public_id || null;
}

// What the customer bot answers from: facts, bank answers, notes and products.
export async function loadPublicShop(env, publicId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT shop_id FROM botcraft_public WHERE public_id = ?").bind(publicId).first();
  if (!row) return null;
  const shop = await loadShop(env, row.shop_id, 0);
  if (!shop) return null;
  const [products, photos, ownerAnswers] = await Promise.all([
    listProducts(env, row.shop_id), listPhotos(env, row.shop_id), listCustomerQuestions(env, row.shop_id, "answered")
  ]);
  return { ...shop, shopId: row.shop_id, products, photos, ownerAnswers };
}

const nameKey = name => String(name).toLowerCase().replace(/\s+/g, " ").trim();

export async function shopExists(env, shopId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  return Boolean(await db.prepare("SELECT 1 FROM botcraft_shops WHERE shop_id = ?").bind(shopId).first());
}

// Merges owner edits into the saved core facts (for example bot_name).
export async function updateFacts(env, shopId, patch) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT facts_json FROM botcraft_shops WHERE shop_id = ?").bind(shopId).first();
  if (!row) return null;
  const facts = { ...JSON.parse(row.facts_json || "{}"), ...patch };
  await db.prepare("UPDATE botcraft_shops SET facts_json = ?, updated_at = ? WHERE shop_id = ?")
    .bind(JSON.stringify(facts), new Date().toISOString(), shopId).run();
  return facts;
}

export async function listProducts(env, shopId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const rows = await db.prepare(
    "SELECT p.name_key, p.name, p.price_text, p.details, p.stock_status, " +
    "(SELECT photo_id FROM botcraft_photos f WHERE f.shop_id = p.shop_id AND f.kind = 'product' AND f.product_key = p.name_key LIMIT 1) AS photo_id " +
    "FROM botcraft_products p WHERE p.shop_id = ? ORDER BY p.updated_at DESC LIMIT 500"
  ).bind(shopId).all();
  return rows.results || [];
}

// Adds or edits a product. Renaming moves its photo to the new name.
export async function saveProduct(env, shopId, { key, name, price_text, details, stock_status }) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const now = new Date().toISOString();
  const newKey = nameKey(name);
  const statements = [];
  if (key && key !== newKey) {
    statements.push(
      db.prepare("DELETE FROM botcraft_products WHERE shop_id = ? AND name_key = ?").bind(shopId, key),
      db.prepare("UPDATE botcraft_photos SET product_key = ? WHERE shop_id = ? AND kind = 'product' AND product_key = ?").bind(newKey, shopId, key)
    );
  }
  statements.push(db.prepare(
    "INSERT INTO botcraft_products (shop_id, name_key, name, price_text, details, stock_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
    "ON CONFLICT(shop_id, name_key) DO UPDATE SET name = excluded.name, price_text = excluded.price_text, details = excluded.details, stock_status = excluded.stock_status, updated_at = excluded.updated_at"
  ).bind(shopId, newKey, name, price_text, details, stock_status, now, now));
  await db.batch(statements);
  return newKey;
}

export async function deleteProduct(env, shopId, key) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await db.batch([
    db.prepare("DELETE FROM botcraft_products WHERE shop_id = ? AND name_key = ?").bind(shopId, key),
    db.prepare("DELETE FROM botcraft_photos WHERE shop_id = ? AND kind = 'product' AND product_key = ?").bind(shopId, key)
  ]);
}

export async function listPhotos(env, shopId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const rows = await db.prepare("SELECT photo_id, kind, product_key FROM botcraft_photos WHERE shop_id = ? ORDER BY created_at").bind(shopId).all();
  return rows.results || [];
}

// Saves a photo. main and owner keep one photo, a product keeps one photo,
// the gallery keeps up to GALLERY_LIMIT. Returns the photo id, or an error.
export async function savePhoto(env, shopId, { kind, productKey = "", mime, bytes }) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const count = await db.prepare("SELECT COUNT(*) AS n, SUM(kind = 'gallery') AS g FROM botcraft_photos WHERE shop_id = ?").bind(shopId).first();
  if (kind === "gallery" && (count?.g || 0) >= GALLERY_LIMIT) return { error: `The gallery holds up to ${GALLERY_LIMIT} photos. Remove one first.` };
  if ((count?.n || 0) >= SHOP_PHOTO_LIMIT) return { error: "This shop has reached its photo limit." };
  const photoId = crypto.randomUUID().replace(/-/g, "");
  const statements = [];
  if (kind !== "gallery") {
    statements.push(db.prepare("DELETE FROM botcraft_photos WHERE shop_id = ? AND kind = ? AND product_key = ?").bind(shopId, kind, productKey));
  }
  statements.push(db.prepare("INSERT INTO botcraft_photos (photo_id, shop_id, kind, product_key, mime, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(photoId, shopId, kind, productKey, mime, bytes, new Date().toISOString()));
  await db.batch(statements);
  return { photoId };
}

export async function deletePhoto(env, shopId, photoId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await db.prepare("DELETE FROM botcraft_photos WHERE shop_id = ? AND photo_id = ?").bind(shopId, photoId).run();
}

export async function loadPhoto(env, photoId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  return db.prepare("SELECT mime, data FROM botcraft_photos WHERE photo_id = ?").bind(photoId).first();
}

const questionKey = text => String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().slice(0, 200);

// A customer question the bot could not answer; asking again counts it again
// and reopens it if the owner had dismissed it.
// Returns true for a question asked for the first time.
export async function logUnanswered(env, shopId, question, product = "") {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const key = questionKey(question);
  if (!key) return false;
  const now = new Date().toISOString();
  const row = await db.prepare(
    "INSERT INTO botcraft_customer_questions (shop_id, q_key, question, product, first_at, last_at) VALUES (?, ?, ?, ?, ?, ?) " +
    "ON CONFLICT(shop_id, q_key) DO UPDATE SET times = times + 1, last_at = excluded.last_at, product = excluded.product, " +
    "status = CASE WHEN botcraft_customer_questions.status = 'dismissed' THEN 'open' ELSE botcraft_customer_questions.status END " +
    "RETURNING times"
  ).bind(shopId, key, question, product, now, now).first();
  return row?.times === 1;
}

export async function listCustomerQuestions(env, shopId, status) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const rows = await db.prepare(
    "SELECT q_key, question, product, times, status, answer, last_at FROM botcraft_customer_questions WHERE shop_id = ? AND status = ? ORDER BY last_at DESC LIMIT 200"
  ).bind(shopId, status).all();
  return rows.results || [];
}

export async function countOpenQuestions(env, shopId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT COUNT(*) AS n FROM botcraft_customer_questions WHERE shop_id = ? AND status = 'open'").bind(shopId).first();
  return row?.n || 0;
}

export async function answerCustomerQuestion(env, shopId, key, answer) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await db.prepare("UPDATE botcraft_customer_questions SET status = 'answered', answer = ? WHERE shop_id = ? AND q_key = ?").bind(answer, shopId, key).run();
}

export async function dismissCustomerQuestion(env, shopId, key) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await db.prepare("UPDATE botcraft_customer_questions SET status = 'dismissed' WHERE shop_id = ? AND q_key = ?").bind(shopId, key).run();
}

export async function loadSettings(env, shopId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT settings_json FROM botcraft_settings WHERE shop_id = ?").bind(shopId).first();
  try { return JSON.parse(row?.settings_json || "{}"); } catch { return {}; }
}

export async function saveSettings(env, shopId, patch) {
  const db = env.BOTCRAFT_DB;
  const settings = { ...(await loadSettings(env, shopId)), ...patch };
  await db.prepare(
    "INSERT INTO botcraft_settings (shop_id, settings_json, updated_at) VALUES (?, ?, ?) " +
    "ON CONFLICT(shop_id) DO UPDATE SET settings_json = excluded.settings_json, updated_at = excluded.updated_at"
  ).bind(shopId, JSON.stringify(settings), new Date().toISOString()).run();
  return settings;
}

const OPEN_REQUEST_STATUSES = ["new", "accepted", "ready"];
// Closed requests (and their photos) are cleared after this many days.
const CLOSED_REQUEST_DAYS = 30;
const DAILY_REQUEST_LIMIT = 200;
const REQUEST_FIELDS = "request_id, kind, code, message, pickup, customer_name, photo_id, status, reply, created_at, updated_at";

async function pruneRequests(db, shopId) {
  const cutoff = new Date(Date.now() - CLOSED_REQUEST_DAYS * 86400000).toISOString();
  const old = "shop_id = ? AND updated_at < ? AND status IN ('done', 'rejected', 'delivered')";
  await db.batch([
    db.prepare(`DELETE FROM botcraft_photos WHERE shop_id = ? AND kind = 'request' AND photo_id IN (SELECT photo_id FROM botcraft_requests WHERE ${old})`).bind(shopId, shopId, cutoff),
    db.prepare(`DELETE FROM botcraft_requests WHERE ${old}`).bind(shopId, cutoff),
    db.prepare("DELETE FROM botcraft_push_subs WHERE shop_id = ? AND role = 'customer' AND request_id NOT IN (SELECT request_id FROM botcraft_requests WHERE shop_id = ?)").bind(shopId, shopId)
  ]);
}

// A customer's photo question or pre-order. Returns the request, or an error.
export async function createRequest(env, shopId, { kind, message, pickup = "", name = "", image = null }) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await pruneRequests(db, shopId);
  const since = new Date(Date.now() - 86400000).toISOString();
  const today = await db.prepare("SELECT COUNT(*) AS n FROM botcraft_requests WHERE shop_id = ? AND kind != 'order' AND created_at > ?").bind(shopId, since).first();
  if ((today?.n || 0) >= DAILY_REQUEST_LIMIT) return { error: "The shop is getting many requests right now. Please call or WhatsApp the shop." };
  let photoId = "";
  if (image) {
    const saved = await savePhoto(env, shopId, { kind: "request", mime: image.mime, bytes: image.bytes });
    if (saved.error) return saved;
    photoId = saved.photoId;
  }
  const open = await db.prepare(`SELECT code FROM botcraft_requests WHERE shop_id = ? AND kind != 'order' AND status IN ('new', 'accepted', 'ready')`).bind(shopId).all();
  const used = new Set((open.results || []).map(r => r.code));
  let code = "";
  for (let i = 0; i < 20 && (!code || used.has(code)); i += 1) code = String(1000 + Math.floor(Math.random() * 9000));
  const requestId = crypto.randomUUID().replace(/-/g, "");
  const now = new Date().toISOString();
  await db.prepare(
    "INSERT INTO botcraft_requests (request_id, shop_id, kind, code, message, pickup, customer_name, photo_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)"
  ).bind(requestId, shopId, kind, code, message, pickup, name, photoId, now, now).run();
  return { request: { request_id: requestId, kind, code, message, pickup, customer_name: name, photo_id: photoId, status: "new", reply: "", created_at: now, updated_at: now } };
}

// The customer's own requests, by their private ids.
export async function getRequests(env, shopId, requestIds) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  if (!requestIds.length) return [];
  const rows = await db.prepare(
    `SELECT ${REQUEST_FIELDS} FROM botcraft_requests WHERE shop_id = ? AND kind != 'order' AND request_id IN (${requestIds.map(() => "?").join(", ")})`
  ).bind(shopId, ...requestIds).all();
  return rows.results || [];
}

// Photo questions and pre-orders for the owner page: open ones first, then
// the latest closed ones.
export async function listRequests(env, shopId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const [open, closed] = await Promise.all([
    db.prepare(`SELECT ${REQUEST_FIELDS} FROM botcraft_requests WHERE shop_id = ? AND kind != 'order' AND status IN ('new', 'accepted', 'ready') ORDER BY created_at DESC LIMIT 200`).bind(shopId).all(),
    db.prepare(`SELECT ${REQUEST_FIELDS} FROM botcraft_requests WHERE shop_id = ? AND kind != 'order' AND status IN ('done', 'rejected') ORDER BY updated_at DESC LIMIT 30`).bind(shopId).all()
  ]);
  return { open: open.results || [], closed: closed.results || [] };
}

export async function countNewRequests(env, shopId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT COUNT(*) AS n FROM botcraft_requests WHERE shop_id = ? AND kind != 'order' AND status = 'new'").bind(shopId).first();
  return row?.n || 0;
}

export async function updateRequest(env, shopId, requestId, { status, reply }) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await db.prepare("UPDATE botcraft_requests SET status = COALESCE(?, status), reply = COALESCE(?, reply), updated_at = ? WHERE shop_id = ? AND request_id = ? AND kind != 'order'")
    .bind(status ?? null, reply ?? null, new Date().toISOString(), shopId, requestId).run();
}

export async function deleteRequest(env, shopId, requestId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await db.batch([
    db.prepare("DELETE FROM botcraft_photos WHERE shop_id = ? AND kind = 'request' AND photo_id IN (SELECT photo_id FROM botcraft_requests WHERE shop_id = ? AND request_id = ?)").bind(shopId, shopId, requestId),
    db.prepare("DELETE FROM botcraft_requests WHERE shop_id = ? AND request_id = ?").bind(shopId, requestId),
    db.prepare("DELETE FROM botcraft_push_subs WHERE shop_id = ? AND role = 'customer' AND request_id = ?").bind(shopId, requestId)
  ]);
}

const orderCode = code => String(code).toUpperCase().replace(/\s+/g, "");

// Adds or updates the order with this bill / order number.
export async function saveOrder(env, shopId, { code, status, note }) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await pruneRequests(db, shopId);
  const key = orderCode(code);
  const now = new Date().toISOString();
  const existing = await db.prepare("SELECT request_id FROM botcraft_requests WHERE shop_id = ? AND kind = 'order' AND code = ?").bind(shopId, key).first();
  if (existing) {
    await db.prepare("UPDATE botcraft_requests SET status = ?, reply = ?, updated_at = ? WHERE request_id = ?").bind(status, note, now, existing.request_id).run();
    return;
  }
  await db.prepare(
    "INSERT INTO botcraft_requests (request_id, shop_id, kind, code, status, reply, created_at, updated_at) VALUES (?, ?, 'order', ?, ?, ?, ?, ?)"
  ).bind(crypto.randomUUID().replace(/-/g, ""), shopId, key, status, note, now, now).run();
}

export async function listOrders(env, shopId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const rows = await db.prepare("SELECT request_id, code, status, reply, updated_at FROM botcraft_requests WHERE shop_id = ? AND kind = 'order' ORDER BY updated_at DESC LIMIT 200").bind(shopId).all();
  return rows.results || [];
}

export async function findOrder(env, shopId, code) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  return db.prepare("SELECT code, status, reply, updated_at FROM botcraft_requests WHERE shop_id = ? AND kind = 'order' AND code = ?").bind(shopId, orderCode(code)).first();
}

// ---- Web Push ----

const MAX_OWNER_DEVICES = 10;

// Saves a browser's push subscription for the owner (requestIds empty) or for
// a customer's requests. Old owner devices beyond the limit are dropped.
export async function savePushSubscription(env, shopId, role, subscription, requestIds = []) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const now = new Date().toISOString();
  const ids = role === "owner" ? [""] : requestIds;
  const sql = "INSERT INTO botcraft_push_subs (endpoint, shop_id, role, request_id, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) " +
    "ON CONFLICT(endpoint, shop_id, role, request_id) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth";
  const statements = ids.map(id => db.prepare(sql).bind(subscription.endpoint, shopId, role, id, subscription.p256dh, subscription.auth, now));
  if (role === "owner") {
    statements.push(db.prepare(
      "DELETE FROM botcraft_push_subs WHERE shop_id = ? AND role = 'owner' AND endpoint NOT IN " +
      "(SELECT endpoint FROM botcraft_push_subs WHERE shop_id = ? AND role = 'owner' ORDER BY created_at DESC LIMIT ?)"
    ).bind(shopId, shopId, MAX_OWNER_DEVICES));
  }
  if (statements.length) await db.batch(statements);
}

// Removes a subscription: everywhere, or only for one shop and role.
export async function deletePushSubscription(env, endpoint, shopId = null, role = null) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  if (shopId) await db.prepare("DELETE FROM botcraft_push_subs WHERE endpoint = ? AND shop_id = ? AND role = ?").bind(endpoint, shopId, role).run();
  else await db.prepare("DELETE FROM botcraft_push_subs WHERE endpoint = ?").bind(endpoint).run();
}

export async function listPushSubscriptions(env, shopId, role, requestId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const rows = await db.prepare("SELECT endpoint, p256dh, auth FROM botcraft_push_subs WHERE shop_id = ? AND role = ? AND request_id = ?")
    .bind(shopId, role, requestId).all();
  return rows.results || [];
}

let vapidKeys = null;

// The VAPID key pair, made the first time it is needed.
export async function loadVapidKeys(env) {
  if (vapidKeys) return vapidKeys;
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  let row = await db.prepare("SELECT value FROM botcraft_keys WHERE name = 'vapid'").first();
  if (!row) {
    const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const raw = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
    const publicKey = btoa(String.fromCharCode(...raw)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
    // Two isolates may race here; the first key saved wins.
    await db.prepare("INSERT OR IGNORE INTO botcraft_keys (name, value) VALUES ('vapid', ?)").bind(JSON.stringify({ publicKey, privateJwk })).run();
    row = await db.prepare("SELECT value FROM botcraft_keys WHERE name = 'vapid'").first();
  }
  vapidKeys = JSON.parse(row.value);
  return vapidKeys;
}
