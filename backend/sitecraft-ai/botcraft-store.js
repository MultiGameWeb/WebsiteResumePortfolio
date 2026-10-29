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
  `CREATE INDEX IF NOT EXISTS idx_botcraft_photos_shop ON botcraft_photos(shop_id, kind)`
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
  const [products, photos] = await Promise.all([listProducts(env, row.shop_id), listPhotos(env, row.shop_id)]);
  return { ...shop, products, photos };
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
