// BotCraft storage in its own D1 database (binding BOTCRAFT_DB, database
// botcraft-db), separate from the website templates' sitecraft-db. Tables are
// created on first use, so no manual migration step is needed.

import { withoutHidden } from "./botcraft-answers.js";

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
  // Sales the owner recorded ("Sold 2 iPhone 15"). unit_price is whole rupees
  // (0 when the item had no price). day is the shop's local date (India, UTC+5:30).
  `CREATE TABLE IF NOT EXISTS botcraft_sales (
    sale_id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    name_key TEXT NOT NULL DEFAULT '',
    item_name TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    unit_price INTEGER NOT NULL DEFAULT 0,
    payment TEXT NOT NULL DEFAULT '',
    day TEXT NOT NULL,
    sold_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_botcraft_sales_shop ON botcraft_sales(shop_id, day)`,
  // Gemini calls made for the OWNER (setup chat, update chat, About text): how many each day, and their tokens,
  // so the cost of owner changes is known and capped. kind is setup, update or about.
  `CREATE TABLE IF NOT EXISTS botcraft_owner_ai (
    shop_id TEXT NOT NULL,
    day TEXT NOT NULL,
    kind TEXT NOT NULL,
    calls INTEGER NOT NULL DEFAULT 0,
    in_tokens INTEGER NOT NULL DEFAULT 0,
    out_tokens INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (shop_id, day, kind)
  )`,
  // Answers the AI already gave, so the same question is not answered (and paid for) again. The key is a hash of the
  // whole prompt (shop information, rules) and the question, so any change to the shop makes old answers unused.
  `CREATE TABLE IF NOT EXISTS botcraft_answer_cache (
    shop_id TEXT NOT NULL,
    cache_key TEXT NOT NULL,
    reply TEXT NOT NULL,
    suggestions TEXT NOT NULL DEFAULT '[]',
    hits INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    last_hit_at TEXT NOT NULL,
    PRIMARY KEY (shop_id, cache_key)
  )`,
  // How many new assistants and setup messages one internet connection may use in a day (abuse protection before payment).
  `CREATE TABLE IF NOT EXISTS botcraft_ip_limits (
    ip_hash TEXT NOT NULL,
    day TEXT NOT NULL,
    kind TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (ip_hash, day, kind)
  )`,
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
  // Reply metering. A customer reply uses one credit; the shop starts with free replies and
  // is topped up later (payment, or the admin). Atomic updates, so two customers at once never overspend.
  `CREATE TABLE IF NOT EXISTS botcraft_replies (
    shop_id TEXT PRIMARY KEY,
    balance INTEGER NOT NULL DEFAULT 0,
    granted INTEGER NOT NULL DEFAULT 0,
    used INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`,
  // Abuse protection: customer AI questions per day, for a whole shop (visitor '*') and per visitor.
  // The visitor is a one-way hash of the connection address and the shop, never the address itself.
  `CREATE TABLE IF NOT EXISTS botcraft_daily_asks (
    shop_id TEXT NOT NULL,
    day TEXT NOT NULL,
    visitor TEXT NOT NULL,
    n INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (shop_id, day, visitor)
  )`,
  // What the replies really cost: replies and Gemini tokens per shop per day.
  `CREATE TABLE IF NOT EXISTS botcraft_usage (
    shop_id TEXT NOT NULL,
    day TEXT NOT NULL,
    replies INTEGER NOT NULL DEFAULT 0,
    in_tokens INTEGER NOT NULL DEFAULT 0,
    out_tokens INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (shop_id, day)
  )`,
  // Server keys made once by the Worker (the VAPID key pair for Web Push).
  `CREATE TABLE IF NOT EXISTS botcraft_keys (
    name TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`
];

export const GALLERY_LIMIT = 10;
export const PRODUCT_PHOTO_LIMIT = 5; // photos per item (front, side, close-up ...)
const SHOP_PHOTO_LIMIT = 500;

const MAX_NOTES = 200;
let schemaReady = null;

export function storeAvailable(env) {
  return Boolean(env?.BOTCRAFT_DB);
}

// Once per Worker isolate.
async function ensureSchema(db) {
  if (!schemaReady) {
    schemaReady = db.batch(SCHEMA.map(sql => db.prepare(sql)))
      // Added later: where a photo's bytes live, 'd1' (in the row) or 'r2' (in the photo bucket).
      .then(() => db.prepare("ALTER TABLE botcraft_photos ADD COLUMN storage TEXT NOT NULL DEFAULT 'd1'").run().catch(() => null))
      // Added later: how many pieces are in stock. NULL means the owner does not count this item.
      .then(() => db.prepare("ALTER TABLE botcraft_products ADD COLUMN qty INTEGER").run().catch(() => null))
      // Added later: how many of the day's replies were made by the optional second provider (Groq).
      .then(() => db.prepare("ALTER TABLE botcraft_usage ADD COLUMN groq_replies INTEGER NOT NULL DEFAULT 0").run().catch(() => null))
      // Added later, for the profit report: credits charged and voice replies per day, and owner credits per kind.
      .then(() => db.prepare("ALTER TABLE botcraft_usage ADD COLUMN credits INTEGER NOT NULL DEFAULT 0").run().catch(() => null))
      .then(() => db.prepare("ALTER TABLE botcraft_usage ADD COLUMN voice_replies INTEGER NOT NULL DEFAULT 0").run().catch(() => null))
      .then(() => db.prepare("ALTER TABLE botcraft_owner_ai ADD COLUMN credits INTEGER NOT NULL DEFAULT 0").run().catch(() => null))
      .catch(error => {
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
  const row = await db.prepare("SELECT p.shop_id FROM botcraft_public p JOIN botcraft_shops s ON s.shop_id = p.shop_id WHERE p.public_id = ? AND s.status != 'disabled'").bind(publicId).first();
  if (!row) return null;
  const shop = await loadShop(env, row.shop_id, 0);
  if (!shop) return null;
  const [products, photos, ownerAnswers] = await Promise.all([
    listProducts(env, row.shop_id), listPhotos(env, row.shop_id), listCustomerQuestions(env, row.shop_id, "answered")
  ]);
  // Answers the owner hid stay saved but never reach customers or the bot.
  const settings = await loadSettings(env, row.shop_id);
  const visible = withoutHidden({ ...shop, ownerAnswers }, settings.hiddenAnswers);
  // Page sections the owner hid (about, gallery, map): customers never get them.
  const hiddenSections = new Set(settings.hiddenSections || []);
  const facts = { ...visible.facts };
  if (hiddenSections.has("about")) delete facts.about;
  if (hiddenSections.has("map")) delete facts.map_link;
  return {
    ...visible, facts, shopId: row.shop_id, products,
    photos: hiddenSections.has("gallery") ? photos.filter(photo => photo.kind !== "gallery") : photos
  };
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
  // The shop name also lives in its own column (used for lists), so keep both the same.
  await db.prepare("UPDATE botcraft_shops SET facts_json = ?, shop_name = ?, updated_at = ? WHERE shop_id = ?")
    .bind(JSON.stringify(facts), String(facts.shop_name || ""), new Date().toISOString(), shopId).run();
  return facts;
}

// Hidden items are for the owner only; customers never get them (includeHidden is false by default).
export async function listProducts(env, shopId, { includeHidden = false } = {}) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const rows = await db.prepare(
    "SELECT p.name_key, p.name, p.price_text, p.details, p.stock_status, p.qty, " +
    "(SELECT photo_id FROM botcraft_photos f WHERE f.shop_id = p.shop_id AND f.kind = 'product' AND f.product_key = p.name_key ORDER BY f.created_at LIMIT 1) AS photo_id " +
    "FROM botcraft_products p WHERE p.shop_id = ? " + (includeHidden ? "" : "AND p.stock_status != 'hidden' ") + "ORDER BY p.updated_at DESC LIMIT 500"
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
  let carriedQty = null;
  if (key && key !== newKey) {
    const old = await db.prepare("SELECT qty FROM botcraft_products WHERE shop_id = ? AND name_key = ?").bind(shopId, key).first();
    carriedQty = old?.qty ?? null;
    statements.push(
      db.prepare("DELETE FROM botcraft_products WHERE shop_id = ? AND name_key = ?").bind(shopId, key),
      db.prepare("UPDATE botcraft_photos SET product_key = ? WHERE shop_id = ? AND kind = 'product' AND product_key = ?").bind(newKey, shopId, key)
    );
  }
  statements.push(db.prepare(
    "INSERT INTO botcraft_products (shop_id, name_key, name, price_text, details, stock_status, qty, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) " +
    "ON CONFLICT(shop_id, name_key) DO UPDATE SET name = excluded.name, price_text = excluded.price_text, details = excluded.details, stock_status = excluded.stock_status, updated_at = excluded.updated_at"
  ).bind(shopId, newKey, name, price_text, details, stock_status, carriedQty, now, now));
  await db.batch(statements);
  return newKey;
}

// True when the shop already has an item with this name (used before renaming).
export async function productExists(env, shopId, name) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT 1 AS found FROM botcraft_products WHERE shop_id = ? AND name_key = ?").bind(shopId, nameKey(name)).first();
  return Boolean(row);
}

// ---- Photo files: D1 rows hold the details; the bytes go to R2 when the BOTCRAFT_PHOTOS bucket is bound ----
const bucketOf = env => env?.BOTCRAFT_PHOTOS || null;
export const photoBucketAvailable = env => Boolean(bucketOf(env));
const photoKey = (shopId, photoId) => `${shopId}/${photoId}`;
const EMPTY_BYTES = new Uint8Array(0);

// Files (in R2) of the photos a condition matches; call before their rows are deleted.
async function r2KeysWhere(db, where, ...binds) {
  const rows = await db.prepare(`SELECT shop_id, photo_id FROM botcraft_photos WHERE storage = 'r2' AND (${where})`).bind(...binds).all();
  return (rows.results || []).map(row => photoKey(row.shop_id, row.photo_id));
}
// A file that cannot be deleted only costs a little storage, so it never fails the owner's action.
async function deleteFiles(env, keys) {
  const bucket = bucketOf(env);
  if (!bucket || !keys.length) return;
  try { await bucket.delete(keys); } catch (error) { console.error("BotCraft photo file delete failed", error); }
}

// Deletes a whole bot: its chat, answers, items, photos (and their R2 files), customer questions and requests,
// public link, settings, reply credits and usage. The owner asked for it; it cannot be undone.
export async function deleteShop(env, shopId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const files = await r2KeysWhere(db, "shop_id = ?", shopId);
  const tables = [
    "botcraft_answers", "botcraft_products", "botcraft_builder_messages", "botcraft_photos", "botcraft_customer_questions",
    "botcraft_requests", "botcraft_sales", "botcraft_owner_ai", "botcraft_answer_cache", "botcraft_public", "botcraft_settings", "botcraft_push_subs", "botcraft_replies", "botcraft_usage",
    "botcraft_daily_asks", "botcraft_shops"
  ];
  await db.batch(tables.map(table => db.prepare(`DELETE FROM ${table} WHERE shop_id = ?`).bind(shopId)));
  await deleteFiles(env, files);
}

export async function deleteProduct(env, shopId, key) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const files = await r2KeysWhere(db, "shop_id = ? AND kind = 'product' AND product_key = ?", shopId, key);
  await db.batch([
    db.prepare("DELETE FROM botcraft_products WHERE shop_id = ? AND name_key = ?").bind(shopId, key),
    db.prepare("DELETE FROM botcraft_photos WHERE shop_id = ? AND kind = 'product' AND product_key = ?").bind(shopId, key)
  ]);
  await deleteFiles(env, files);
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
  let replacedFiles = [];
  if (kind === "product") {
    // An item keeps several photos; the first one is its cover.
    const have = await db.prepare("SELECT COUNT(*) AS n FROM botcraft_photos WHERE shop_id = ? AND kind = 'product' AND product_key = ?").bind(shopId, productKey).first();
    if ((have?.n || 0) >= PRODUCT_PHOTO_LIMIT) return { error: `An item holds up to ${PRODUCT_PHOTO_LIMIT} photos. Remove one first.` };
  } else if (kind !== "gallery") {
    // One photo of this kind (main, owner): the new one replaces the old one and its file.
    replacedFiles = await r2KeysWhere(db, "shop_id = ? AND kind = ? AND product_key = ?", shopId, kind, productKey);
    statements.push(db.prepare("DELETE FROM botcraft_photos WHERE shop_id = ? AND kind = ? AND product_key = ?").bind(shopId, kind, productKey));
  }
  const bucket = bucketOf(env);
  if (bucket) await bucket.put(photoKey(shopId, photoId), bytes, { httpMetadata: { contentType: mime } });
  statements.push(db.prepare("INSERT INTO botcraft_photos (photo_id, shop_id, kind, product_key, mime, data, created_at, storage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(photoId, shopId, kind, productKey, mime, bucket ? EMPTY_BYTES : bytes, new Date().toISOString(), bucket ? "r2" : "d1"));
  try {
    await db.batch(statements);
  } catch (error) {
    if (bucket) await deleteFiles(env, [photoKey(shopId, photoId)]);
    throw error;
  }
  await deleteFiles(env, replacedFiles);
  return { photoId };
}

// Swaps an item photo for a new one (a studio clean-up the owner approved). The new photo
// takes the old one's place in the list, so a cover photo stays the cover.
export async function replacePhoto(env, shopId, oldPhotoId, { mime, bytes }) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const old = await db.prepare("SELECT kind, product_key, created_at FROM botcraft_photos WHERE shop_id = ? AND photo_id = ?").bind(shopId, oldPhotoId).first();
  if (!old || old.kind !== "product") return { error: "That photo was not found." };
  const photoId = crypto.randomUUID().replace(/-/g, "");
  const oldFiles = await r2KeysWhere(db, "shop_id = ? AND photo_id = ?", shopId, oldPhotoId);
  const bucket = bucketOf(env);
  if (bucket) await bucket.put(photoKey(shopId, photoId), bytes, { httpMetadata: { contentType: mime } });
  try {
    await db.batch([
      db.prepare("DELETE FROM botcraft_photos WHERE shop_id = ? AND photo_id = ?").bind(shopId, oldPhotoId),
      db.prepare("INSERT INTO botcraft_photos (photo_id, shop_id, kind, product_key, mime, data, created_at, storage) VALUES (?, ?, 'product', ?, ?, ?, ?, ?)")
        .bind(photoId, shopId, old.product_key, mime, bucket ? EMPTY_BYTES : bytes, old.created_at, bucket ? "r2" : "d1")
    ]);
  } catch (error) {
    if (bucket) await deleteFiles(env, [photoKey(shopId, photoId)]);
    throw error;
  }
  await deleteFiles(env, oldFiles);
  return { photoId };
}

export async function deletePhoto(env, shopId, photoId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const files = await r2KeysWhere(db, "shop_id = ? AND photo_id = ?", shopId, photoId);
  await db.prepare("DELETE FROM botcraft_photos WHERE shop_id = ? AND photo_id = ?").bind(shopId, photoId).run();
  await deleteFiles(env, files);
}

export async function loadPhoto(env, photoId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT shop_id, mime, data, storage FROM botcraft_photos WHERE photo_id = ?").bind(photoId).first();
  if (!row) return null;
  if (row.storage !== "r2") return { mime: row.mime, data: row.data };
  const bucket = bucketOf(env);
  const object = bucket ? await bucket.get(photoKey(row.shop_id, photoId)) : null;
  return object ? { mime: row.mime, data: await object.arrayBuffer() } : null;
}

// Moves photos still stored in D1 to R2, a few at a time (admin action). Safe to repeat.
export async function migratePhotosToR2(env, limit = 20) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const bucket = bucketOf(env);
  if (!bucket) return { ok: false, error: "The photo bucket (BOTCRAFT_PHOTOS) is not connected." };
  const rows = await db.prepare("SELECT photo_id, shop_id, mime, data FROM botcraft_photos WHERE storage = 'd1' LIMIT ?").bind(Math.max(1, Math.min(50, Math.floor(limit) || 20))).all();
  let moved = 0;
  for (const row of rows.results || []) {
    const bytes = row.data instanceof ArrayBuffer || ArrayBuffer.isView(row.data) ? row.data : Uint8Array.from(row.data);
    await bucket.put(photoKey(row.shop_id, row.photo_id), bytes, { httpMetadata: { contentType: row.mime } });
    // Only after the file is safely in R2 is the copy in the row emptied.
    const changed = await db.prepare("UPDATE botcraft_photos SET storage = 'r2', data = ? WHERE photo_id = ? AND storage = 'd1'").bind(EMPTY_BYTES, row.photo_id).run();
    if (changed.meta?.changes) moved += 1;
  }
  return { ok: true, moved, ...(await photoStorageStats(env)) };
}

export async function photoStorageStats(env) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const rows = await db.prepare("SELECT storage, COUNT(*) AS n, COALESCE(SUM(LENGTH(data)), 0) AS bytes FROM botcraft_photos GROUP BY storage").all();
  const by = Object.fromEntries((rows.results || []).map(row => [row.storage, row]));
  return { r2Available: photoBucketAvailable(env), inD1: Number(by.d1?.n || 0), inD1Bytes: Number(by.d1?.bytes || 0), inR2: Number(by.r2?.n || 0), remaining: Number(by.d1?.n || 0) };
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

// Setup-chat answers the owner edits or deletes from the owner page.
export async function setAnswerValue(env, shopId, questionId, value) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await db.prepare(
    "INSERT INTO botcraft_answers (shop_id, question_id, value, updated_at) VALUES (?, ?, ?, ?) " +
    "ON CONFLICT(shop_id, question_id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  ).bind(shopId, questionId, value, new Date().toISOString()).run();
}

export async function deleteAnswerRow(env, shopId, questionId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await db.prepare("DELETE FROM botcraft_answers WHERE shop_id = ? AND question_id = ?").bind(shopId, questionId).run();
}

export async function setNotes(env, shopId, notes) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await db.prepare("UPDATE botcraft_shops SET notes_json = ?, updated_at = ? WHERE shop_id = ?")
    .bind(JSON.stringify(notes.slice(-MAX_NOTES)), new Date().toISOString(), shopId).run();
}

// ---- Daily caps (abuse protection) ----
export const DEFAULT_SHOP_DAILY_ASKS = 500;
export const DEFAULT_VISITOR_DAILY_ASKS = 40;
const positive = (value, fallback) => (Number(value) > 0 ? Math.floor(Number(value)) : fallback);
export const shopDailyLimit = env => positive(env?.BOTCRAFT_SHOP_DAILY_REPLIES, DEFAULT_SHOP_DAILY_ASKS);
export const visitorDailyLimit = env => positive(env?.BOTCRAFT_VISITOR_DAILY_REPLIES, DEFAULT_VISITOR_DAILY_ASKS);

// One counter step that never goes past the limit: true when a slot was taken.
async function takeSlot(db, shopId, day, visitor, limit) {
  const result = await db.prepare(
    "INSERT INTO botcraft_daily_asks (shop_id, day, visitor, n) VALUES (?, ?, ?, 1) " +
    "ON CONFLICT(shop_id, day, visitor) DO UPDATE SET n = n + 1 WHERE n < ?"
  ).bind(shopId, day, visitor, limit).run();
  return Boolean(result.meta?.changes);
}

// Takes one slot from the shop's daily total and one from this visitor's. Returns
// { ok: true } or { ok: false, code: "daily_limit" | "visitor_limit" }.
export async function takeDailyAsk(env, shopId, visitorHash, { shopLimit = DEFAULT_SHOP_DAILY_ASKS, visitorLimit = DEFAULT_VISITOR_DAILY_ASKS } = {}) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const day = new Date().toISOString().slice(0, 10);
  if (Math.random() < 0.02) await db.prepare("DELETE FROM botcraft_daily_asks WHERE day < ?").bind(new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)).run().catch(() => {});
  if (!(await takeSlot(db, shopId, day, "*", shopLimit))) return { ok: false, code: "daily_limit" };
  if (!(await takeSlot(db, shopId, day, visitorHash, visitorLimit))) {
    await db.prepare("UPDATE botcraft_daily_asks SET n = MAX(0, n - 1) WHERE shop_id = ? AND day = ? AND visitor = '*'").bind(shopId, day).run();
    return { ok: false, code: "visitor_limit" };
  }
  return { ok: true };
}

// ---- Reply metering ----
// A small allowance so the owner can test the assistant before paying (20 replies, about Rs 3 of AI). It is not part of a plan. Change it with BOTCRAFT_FREE_REPLIES.
export const DEFAULT_FREE_REPLIES = 20;
export const freeRepliesFor = env => (Number(env?.BOTCRAFT_FREE_REPLIES) >= 0 && env?.BOTCRAFT_FREE_REPLIES !== undefined && env?.BOTCRAFT_FREE_REPLIES !== "" ? Math.floor(Number(env.BOTCRAFT_FREE_REPLIES)) : DEFAULT_FREE_REPLIES);

// Takes one credit before the AI is asked. { ok: true, balance } or { ok: false, balance: 0 }.
export async function reserveReply(env, shopId, freeReplies = DEFAULT_FREE_REPLIES, cost = 1) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const now = new Date().toISOString();
  const credits = Math.max(1, Math.floor(Number(cost)) || 1);
  // A shop's first customer reply creates its row with the free replies.
  await db.prepare("INSERT OR IGNORE INTO botcraft_replies (shop_id, balance, granted, used, updated_at) VALUES (?, ?, ?, 0, ?)").bind(shopId, freeReplies, freeReplies, now).run();
  const taken = await db.prepare("UPDATE botcraft_replies SET balance = balance - ?, used = used + ?, updated_at = ? WHERE shop_id = ? AND balance >= ?").bind(credits, credits, now, shopId, credits).run();
  const row = await db.prepare("SELECT balance FROM botcraft_replies WHERE shop_id = ?").bind(shopId).first();
  const balance = Number(row?.balance ?? 0);
  // short: some credits are left, just not enough for a voice, photo or file reply (a text reply still works).
  if (!taken.meta?.changes) return { ok: false, balance, short: balance > 0 };
  return { ok: true, balance };
}

// The AI failed: give the credits back.
export async function releaseReply(env, shopId, cost = 1) {
  const db = env.BOTCRAFT_DB;
  const credits = Math.max(1, Math.floor(Number(cost)) || 1);
  await db.prepare("UPDATE botcraft_replies SET balance = balance + ?, used = MAX(0, used - ?), updated_at = ? WHERE shop_id = ?").bind(credits, credits, new Date().toISOString(), shopId).run();
}

// Credits one reply uses. A text reply is 1; voice, photos and files cost the AI more, so they use more.
// Change them with BOTCRAFT_COST_VOICE, BOTCRAFT_COST_PHOTO and BOTCRAFT_COST_FILE.
export function replyCost(env, { voice = false, photos = 0, files = 0 } = {}) {
  const read = (name, fallback) => { const n = Number(env?.[name]); return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 20) : fallback; };
  if (voice) return read("BOTCRAFT_COST_VOICE", 3);
  return Math.max(1, photos ? read("BOTCRAFT_COST_PHOTO", 2) : 1, files ? read("BOTCRAFT_COST_FILE", 2) : 1);
}

export async function recordUsage(env, shopId, { inTokens = 0, outTokens = 0, provider = "gemini", credits = 1, voice = false } = {}) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const groq = provider === "groq" ? 1 : 0;
  await db.prepare(
    "INSERT INTO botcraft_usage (shop_id, day, replies, in_tokens, out_tokens, groq_replies, credits, voice_replies) VALUES (?, ?, 1, ?, ?, ?, ?, ?) " +
    "ON CONFLICT(shop_id, day) DO UPDATE SET replies = replies + 1, in_tokens = in_tokens + excluded.in_tokens, out_tokens = out_tokens + excluded.out_tokens, groq_replies = groq_replies + excluded.groq_replies, credits = credits + excluded.credits, voice_replies = voice_replies + excluded.voice_replies"
  ).bind(shopId, new Date().toISOString().slice(0, 10), Math.max(0, Math.floor(inTokens)), Math.max(0, Math.floor(outTokens)), groq, Math.max(0, Math.floor(credits)), voice ? 1 : 0).run();
}

// Adds replies (a recharge or a gift). Creates the row with the free replies first when the shop has none yet.
export async function addReplies(env, shopId, count, freeReplies = DEFAULT_FREE_REPLIES) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const now = new Date().toISOString();
  await db.prepare("INSERT OR IGNORE INTO botcraft_replies (shop_id, balance, granted, used, updated_at) VALUES (?, ?, ?, 0, ?)").bind(shopId, freeReplies, freeReplies, now).run();
  await db.prepare("UPDATE botcraft_replies SET balance = MAX(0, balance + ?), granted = granted + MAX(0, ?), updated_at = ? WHERE shop_id = ?").bind(count, count, now, shopId).run();
  return replyStatus(env, shopId, freeReplies);
}

// What the owner page and the admin show. A shop that has had no customer replies yet still shows its free replies.
export async function replyStatus(env, shopId, freeReplies = DEFAULT_FREE_REPLIES) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT balance, granted, used FROM botcraft_replies WHERE shop_id = ?").bind(shopId).first();
  const day = new Date().toISOString().slice(0, 10);
  const monthStart = day.slice(0, 8) + "01";
  const [today, month, total] = await Promise.all([
    db.prepare("SELECT replies, in_tokens, out_tokens FROM botcraft_usage WHERE shop_id = ? AND day = ?").bind(shopId, day).first(),
    db.prepare("SELECT COALESCE(SUM(replies), 0) AS replies, COALESCE(SUM(in_tokens), 0) AS in_tokens, COALESCE(SUM(out_tokens), 0) AS out_tokens FROM botcraft_usage WHERE shop_id = ? AND day >= ?").bind(shopId, monthStart).first(),
    db.prepare("SELECT COALESCE(SUM(replies), 0) AS replies, COALESCE(SUM(in_tokens), 0) AS in_tokens, COALESCE(SUM(out_tokens), 0) AS out_tokens FROM botcraft_usage WHERE shop_id = ?").bind(shopId).first()
  ]);
  const balance = row ? Number(row.balance) : freeReplies;
  const granted = row ? Number(row.granted) : freeReplies;
  return {
    balance, granted, used: row ? Number(row.used) : 0,
    usedToday: Number(today?.replies || 0), usedMonth: Number(month?.replies || 0),
    tokens: { in: Number(total?.in_tokens || 0), out: Number(total?.out_tokens || 0), replies: Number(total?.replies || 0) },
    low: balance <= Math.max(10, Math.floor(granted * 0.1))
  };
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

async function pruneRequests(env, db, shopId) {
  const cutoff = new Date(Date.now() - CLOSED_REQUEST_DAYS * 86400000).toISOString();
  const old = "shop_id = ? AND updated_at < ? AND status IN ('done', 'rejected', 'delivered')";
  const files = await r2KeysWhere(db, `shop_id = ? AND kind = 'request' AND photo_id IN (SELECT photo_id FROM botcraft_requests WHERE ${old})`, shopId, shopId, cutoff);
  await db.batch([
    db.prepare(`DELETE FROM botcraft_photos WHERE shop_id = ? AND kind = 'request' AND photo_id IN (SELECT photo_id FROM botcraft_requests WHERE ${old})`).bind(shopId, shopId, cutoff),
    db.prepare(`DELETE FROM botcraft_requests WHERE ${old}`).bind(shopId, cutoff),
    db.prepare("DELETE FROM botcraft_push_subs WHERE shop_id = ? AND role = 'customer' AND request_id NOT IN (SELECT request_id FROM botcraft_requests WHERE shop_id = ?)").bind(shopId, shopId)
  ]);
  await deleteFiles(env, files);
}

// A customer's photo question or pre-order. Returns the request, or an error.
export async function createRequest(env, shopId, { kind, message, pickup = "", name = "", image = null }) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await pruneRequests(env, db, shopId);
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
  const files = await r2KeysWhere(db, "shop_id = ? AND kind = 'request' AND photo_id IN (SELECT photo_id FROM botcraft_requests WHERE shop_id = ? AND request_id = ?)", shopId, shopId, requestId);
  await db.batch([
    db.prepare("DELETE FROM botcraft_photos WHERE shop_id = ? AND kind = 'request' AND photo_id IN (SELECT photo_id FROM botcraft_requests WHERE shop_id = ? AND request_id = ?)").bind(shopId, shopId, requestId),
    db.prepare("DELETE FROM botcraft_requests WHERE shop_id = ? AND request_id = ?").bind(shopId, requestId),
    db.prepare("DELETE FROM botcraft_push_subs WHERE shop_id = ? AND role = 'customer' AND request_id = ?").bind(shopId, requestId)
  ]);
  await deleteFiles(env, files);
}

const orderCode = code => String(code).toUpperCase().replace(/\s+/g, "");

// Adds or updates the order with this bill / order number.
export async function saveOrder(env, shopId, { code, status, note }) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await pruneRequests(env, db, shopId);
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


// ---- Sales the owner records ----

const SALE_PAYMENTS = ["cash", "upi", "card", "other"];
const shopDay = date => new Date(date.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

// First whole-rupee amount in a price text such as "₹52,990" or "Rs 799 onwards". 0 when there is none.
export function priceNumber(text) {
  const match = String(text ?? "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Math.round(Number(match[0])) : 0;
}

export async function recordSale(env, shopId, { key = "", name, qty = 1, unitPrice = 0, payment = "", now = new Date() }) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const id = `s_${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const count = Math.min(Math.max(Math.round(Number(qty)) || 1, 1), 9999);
  const price = Math.min(Math.max(Math.round(Number(unitPrice)) || 0, 0), 99999999);
  await db.prepare("INSERT INTO botcraft_sales (sale_id, shop_id, name_key, item_name, qty, unit_price, payment, day, sold_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, shopId, String(key).slice(0, 140), String(name).slice(0, 120), count, price, SALE_PAYMENTS.includes(payment) ? payment : "", shopDay(now), now.toISOString()).run();
  return id;
}

export async function deleteSale(env, shopId, saleId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT name_key, qty FROM botcraft_sales WHERE shop_id = ? AND sale_id = ?").bind(shopId, String(saleId)).first();
  await db.prepare("DELETE FROM botcraft_sales WHERE shop_id = ? AND sale_id = ?").bind(shopId, String(saleId)).run();
  return row ? { key: row.name_key, qty: row.qty } : null;
}

// Totals for today, the last 7 days and the last 30 days, today's items, and the latest sales.
export async function salesSummary(env, shopId, now = new Date()) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const today = shopDay(now);
  const since = shopDay(new Date(now.getTime() - 29 * 86400000));
  const rows = (await db.prepare("SELECT sale_id, name_key, item_name, qty, unit_price, payment, day, sold_at FROM botcraft_sales WHERE shop_id = ? AND day >= ? ORDER BY sold_at DESC LIMIT 2000")
    .bind(shopId, since).all()).results || [];
  const weekStart = shopDay(new Date(now.getTime() - 6 * 86400000));
  const blank = () => ({ sales: 0, qty: 0, total: 0, unpriced: 0 });
  const totals = { today: blank(), week: blank(), month: blank() };
  const byItem = new Map();
  const byPayment = {};
  for (const row of rows) {
    const amount = row.qty * row.unit_price;
    const add = bucket => { bucket.sales += 1; bucket.qty += row.qty; bucket.total += amount; if (!row.unit_price) bucket.unpriced += 1; };
    add(totals.month);
    if (row.day >= weekStart) add(totals.week);
    if (row.day === today) {
      add(totals.today);
      const entry = byItem.get(row.name_key || row.item_name) || { name: row.item_name, qty: 0, total: 0 };
      entry.qty += row.qty; entry.total += amount;
      byItem.set(row.name_key || row.item_name, entry);
      const pay = row.payment || "other";
      byPayment[pay] = (byPayment[pay] || 0) + amount;
    }
  }
  return {
    day: today,
    ...totals,
    todayItems: [...byItem.values()].sort((a, b) => b.total - a.total || b.qty - a.qty),
    todayByPayment: byPayment,
    recent: rows.slice(0, 20).map(row => ({ id: row.sale_id, name: row.item_name, qty: row.qty, unit_price: row.unit_price, total: row.qty * row.unit_price, payment: row.payment, day: row.day, at: row.sold_at }))
  };
}


// ---- Stock count ----

export const LOW_STOCK = 3;

// Sets (qty) or changes (delta) the count of one item. Items the owner never counted (qty NULL) stay uncounted
// when a sale is taken off. Reaching 0 marks the item out of stock; a count above 0 brings an out-of-stock item back.
// A hidden item stays hidden. Returns the new count, or null when the item is uncounted.
export async function changeQty(env, shopId, key, { qty, delta, fromSale = false }) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT qty, stock_status FROM botcraft_products WHERE shop_id = ? AND name_key = ?").bind(shopId, key).first();
  if (!row) return undefined;
  const clamp = n => Math.min(Math.max(Math.round(Number(n)) || 0, 0), 999999);
  let next;
  if (qty === null) next = null;
  else if (qty !== undefined) next = clamp(qty);
  else if (row.qty === null || row.qty === undefined) next = fromSale ? null : clamp(delta);
  else next = clamp(row.qty + Number(delta || 0));
  let status = row.stock_status;
  if (next !== null && status !== "hidden") status = next === 0 ? "out_of_stock" : status === "out_of_stock" ? "in_stock" : status;
  await db.prepare("UPDATE botcraft_products SET qty = ?, stock_status = ?, updated_at = ? WHERE shop_id = ? AND name_key = ?")
    .bind(next, status, new Date().toISOString(), shopId, key).run();
  return next;
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

// The Sales tab: every day between two dates (shop days), item and payment totals, and the sales themselves.
export async function salesReport(env, shopId, from, to, now = new Date()) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const today = shopDay(now);
  if (!DAY_PATTERN.test(String(from)) || !DAY_PATTERN.test(String(to))) return { error: "Please choose the dates." };
  if (from > to) [from, to] = [to, from];
  if (to > today) to = today;
  if (from > to) from = to;
  if (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`) > 365 * 86400000) from = addDays(to, -365);
  const rows = (await db.prepare("SELECT sale_id, name_key, item_name, qty, unit_price, payment, day, sold_at FROM botcraft_sales WHERE shop_id = ? AND day >= ? AND day <= ? ORDER BY sold_at DESC LIMIT 5000")
    .bind(shopId, from, to).all()).results || [];
  const byDay = new Map();
  for (let day = from; day <= to; day = addDays(day, 1)) byDay.set(day, { day, sales: 0, qty: 0, total: 0 });
  const byItem = new Map();
  const payments = {};
  const totals = { sales: 0, qty: 0, total: 0, unpriced: 0 };
  for (const row of rows) {
    const amount = row.qty * row.unit_price;
    const dayRow = byDay.get(row.day);
    if (dayRow) { dayRow.sales += 1; dayRow.qty += row.qty; dayRow.total += amount; }
    const item = byItem.get(row.name_key || row.item_name) || { name: row.item_name, qty: 0, total: 0, sales: 0 };
    item.qty += row.qty; item.total += amount; item.sales += 1;
    byItem.set(row.name_key || row.item_name, item);
    const pay = row.payment || "other";
    payments[pay] = (payments[pay] || 0) + amount;
    totals.sales += 1; totals.qty += row.qty; totals.total += amount; if (!row.unit_price) totals.unpriced += 1;
  }
  return {
    from, to, today, totals, payments,
    days: [...byDay.values()],
    items: [...byItem.values()].sort((a, b) => b.total - a.total || b.qty - a.qty),
    rows: rows.slice(0, 1000).map(row => ({ id: row.sale_id, name: row.item_name, qty: row.qty, unit_price: row.unit_price, total: row.qty * row.unit_price, payment: row.payment, day: row.day, at: row.sold_at }))
  };
}

// ---- Owner AI cap: every Gemini call made for the owner is counted and capped per shop per day ----

export const OWNER_AI_DEFAULTS = { setup: 80, update: 40, about: 6 };

// Takes one call of the day. False when the shop's limit for this kind is used up (the call is then not made).
export async function takeOwnerAi(env, shopId, kind, limit, now = new Date()) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const day = shopDay(now);
  await db.prepare("INSERT OR IGNORE INTO botcraft_owner_ai (shop_id, day, kind, calls) VALUES (?, ?, ?, 0)").bind(shopId, day, kind).run();
  const result = await db.prepare("UPDATE botcraft_owner_ai SET calls = calls + 1 WHERE shop_id = ? AND day = ? AND kind = ? AND calls < ?").bind(shopId, day, kind, limit).run();
  return (result?.meta?.changes || 0) > 0;
}

export async function addOwnerTokens(env, shopId, kind, { inTokens = 0, outTokens = 0 } = {}, now = new Date()) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  await db.prepare("UPDATE botcraft_owner_ai SET in_tokens = in_tokens + ?, out_tokens = out_tokens + ? WHERE shop_id = ? AND day = ? AND kind = ?")
    .bind(Math.max(0, Math.round(inTokens)), Math.max(0, Math.round(outTokens)), shopId, shopDay(now), kind).run();
}

// This month's owner AI use of a shop, for the owner page and for admin.
export async function ownerAiMonth(env, shopId, now = new Date()) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const since = shopDay(new Date(now.getTime() - 29 * 86400000));
  const rows = (await db.prepare("SELECT kind, SUM(calls) AS calls, SUM(in_tokens) AS in_tokens, SUM(out_tokens) AS out_tokens FROM botcraft_owner_ai WHERE shop_id = ? AND day >= ? GROUP BY kind").bind(shopId, since).all()).results || [];
  const today = (await db.prepare("SELECT kind, calls FROM botcraft_owner_ai WHERE shop_id = ? AND day = ?").bind(shopId, shopDay(now)).all()).results || [];
  return { month: rows, today: Object.fromEntries(today.map(row => [row.kind, row.calls])) };
}

// ---- Answer cache ----

export const CACHE_MAX_PER_SHOP = 300;
export const CACHE_MAX_AGE_DAYS = 30;

export async function sha256Hex(text) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// The question in a form that ignores case, punctuation and extra spaces ("What are your timings??" = "what are your timings").
export const normalizeQuestion = text => String(text || "").toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

export async function getCachedAnswer(env, shopId, cacheKey, now = new Date()) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT reply, suggestions, created_at FROM botcraft_answer_cache WHERE shop_id = ? AND cache_key = ?").bind(shopId, cacheKey).first();
  if (!row) return null;
  if (Date.parse(row.created_at) < now.getTime() - CACHE_MAX_AGE_DAYS * 86400000) return null;
  await db.prepare("UPDATE botcraft_answer_cache SET hits = hits + 1, last_hit_at = ? WHERE shop_id = ? AND cache_key = ?").bind(now.toISOString(), shopId, cacheKey).run();
  let suggestions = [];
  try { suggestions = JSON.parse(row.suggestions); } catch { /* none */ }
  return { reply: row.reply, suggestions: Array.isArray(suggestions) ? suggestions : [] };
}

export async function saveCachedAnswer(env, shopId, cacheKey, { reply, suggestions = [] }, now = new Date()) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const stamp = now.toISOString();
  await db.prepare(
    "INSERT INTO botcraft_answer_cache (shop_id, cache_key, reply, suggestions, hits, created_at, last_hit_at) VALUES (?, ?, ?, ?, 0, ?, ?) " +
    "ON CONFLICT(shop_id, cache_key) DO UPDATE SET reply = excluded.reply, suggestions = excluded.suggestions, created_at = excluded.created_at, last_hit_at = excluded.last_hit_at"
  ).bind(shopId, cacheKey, String(reply).slice(0, 1500), JSON.stringify(suggestions.slice(0, 3)), stamp, stamp).run();
  // Keep the shop's most recently used answers; old ones go.
  await db.prepare("DELETE FROM botcraft_answer_cache WHERE shop_id = ? AND cache_key NOT IN (SELECT cache_key FROM botcraft_answer_cache WHERE shop_id = ? ORDER BY last_hit_at DESC LIMIT ?)")
    .bind(shopId, shopId, CACHE_MAX_PER_SHOP).run();
}

export async function cacheStats(env, shopId) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const row = await db.prepare("SELECT COUNT(*) AS saved, COALESCE(SUM(hits), 0) AS hits FROM botcraft_answer_cache WHERE shop_id = ?").bind(shopId).first();
  return { saved: Number(row?.saved || 0), hits: Number(row?.hits || 0) };
}

// ---- Abuse protection: limits per internet connection per day ----

export async function takeIpLimit(env, ipHash, kind, limit, now = new Date()) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const day = now.toISOString().slice(0, 10);
  await db.prepare("INSERT OR IGNORE INTO botcraft_ip_limits (ip_hash, day, kind, count) VALUES (?, ?, ?, 0)").bind(ipHash, day, kind).run();
  const result = await db.prepare("UPDATE botcraft_ip_limits SET count = count + 1 WHERE ip_hash = ? AND day = ? AND kind = ? AND count < ?").bind(ipHash, day, kind, limit).run();
  // Old days are not needed.
  if (Math.random() < 0.02) await db.prepare("DELETE FROM botcraft_ip_limits WHERE day < ?").bind(new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10)).run().catch(() => {});
  return (result?.meta?.changes || 0) > 0;
}

// Owner AI credits are recorded once the work succeeded (for the profit report). countCall adds a call too (the studio has no daily call counter of its own).
export async function recordOwnerCredits(env, shopId, kind, credits, { countCall = false, now = new Date() } = {}) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const day = shopDay(now);
  await db.prepare("INSERT OR IGNORE INTO botcraft_owner_ai (shop_id, day, kind, calls) VALUES (?, ?, ?, 0)").bind(shopId, day, kind).run();
  await db.prepare("UPDATE botcraft_owner_ai SET credits = credits + ?, calls = calls + ? WHERE shop_id = ? AND day = ? AND kind = ?").bind(Math.max(0, Math.round(credits)), countCall ? 1 : 0, shopId, day, kind).run();
}

// ---- Profit report: what the AI cost us against what the credits are worth ----
// Rates are estimates from the published prices; change them with the Worker variables if the prices change:
//   PROFIT_USD_TO_INR (90), PROFIT_IN_USD_PER_M (0.25), PROFIT_OUT_USD_PER_M (1.5), PROFIT_CREDIT_INR (0.20),
//   PROFIT_VOICE_TTS_INR (0.25 per spoken answer), PROFIT_STUDIO_INR (3.6 per studio photo).
export function profitRates(env) {
  const n = (name, fallback) => { const v = Number(env?.[name]); return Number.isFinite(v) && v >= 0 ? v : fallback; };
  return { fx: n("PROFIT_USD_TO_INR", 90), inRate: n("PROFIT_IN_USD_PER_M", 0.25), outRate: n("PROFIT_OUT_USD_PER_M", 1.5), creditInr: n("PROFIT_CREDIT_INR", 0.2), voiceInr: n("PROFIT_VOICE_TTS_INR", 0.25), studioInr: n("PROFIT_STUDIO_INR", 3.6) };
}

// Turns summed usage into rupees. Pure, so it is easy to check.
export function profitOf(rates, { replies = 0, groqReplies = 0, voiceReplies = 0, customerCredits = 0, inTokens = 0, outTokens = 0, ownerCredits = 0, ownerInTokens = 0, ownerOutTokens = 0, studioPhotos = 0 }) {
  const tokenCost = (inT, outT) => ((inT * rates.inRate + outT * rates.outRate) / 1e6) * rates.fx;
  const cost = tokenCost(inTokens + ownerInTokens, outTokens + ownerOutTokens) + voiceReplies * rates.voiceInr + studioPhotos * rates.studioInr;
  const revenue = (customerCredits + ownerCredits) * rates.creditInr;
  return {
    replies, groqReplies, voiceReplies, customerCredits, ownerCredits, studioPhotos,
    tokens: { in: inTokens + ownerInTokens, out: outTokens + ownerOutTokens },
    costInr: Math.round(cost * 100) / 100, revenueInr: Math.round(revenue * 100) / 100,
    marginInr: Math.round((revenue - cost) * 100) / 100,
    marginPct: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 1000) / 10 : null,
    loss: cost > revenue + 0.005
  };
}

// Last 30 days. One shop, or every shop that had any use (shopId = null), worst margins first.
export async function profitReport(env, shopId = null, now = new Date()) {
  const db = env.BOTCRAFT_DB;
  await ensureSchema(db);
  const since = shopDay(new Date(now.getTime() - 29 * 86400000));
  const rates = profitRates(env);
  const where = shopId ? "WHERE shop_id = ? AND day >= ?" : "WHERE day >= ?";
  const binds = shopId ? [shopId, since] : [since];
  const usage = (await db.prepare(`SELECT shop_id, SUM(replies) AS replies, SUM(groq_replies) AS groq, SUM(voice_replies) AS voice, SUM(credits) AS credits, SUM(in_tokens) AS in_t, SUM(out_tokens) AS out_t FROM botcraft_usage ${where} GROUP BY shop_id`).bind(...binds).all()).results || [];
  const owner = (await db.prepare(`SELECT shop_id, kind, SUM(calls) AS calls, SUM(credits) AS credits, SUM(in_tokens) AS in_t, SUM(out_tokens) AS out_t FROM botcraft_owner_ai ${where} GROUP BY shop_id, kind`).bind(...binds).all()).results || [];
  const byShop = new Map();
  const slot = id => { if (!byShop.has(id)) byShop.set(id, { replies: 0, groqReplies: 0, voiceReplies: 0, customerCredits: 0, inTokens: 0, outTokens: 0, ownerCredits: 0, ownerInTokens: 0, ownerOutTokens: 0, studioPhotos: 0 }); return byShop.get(id); };
  for (const row of usage) Object.assign(slot(row.shop_id), { replies: Number(row.replies), groqReplies: Number(row.groq), voiceReplies: Number(row.voice), customerCredits: Number(row.credits), inTokens: Number(row.in_t), outTokens: Number(row.out_t) });
  for (const row of owner) {
    const entry = slot(row.shop_id);
    entry.ownerCredits += Number(row.credits); entry.ownerInTokens += Number(row.in_t); entry.ownerOutTokens += Number(row.out_t);
    if (row.kind === "studio") entry.studioPhotos += Number(row.calls);
  }
  const shops = [...byShop.entries()].map(([id, entry]) => ({ shopId: id, ...profitOf(rates, entry) })).sort((a, b) => a.marginInr - b.marginInr);
  const total = profitOf(rates, [...byShop.values()].reduce((sum, e) => { for (const k of Object.keys(e)) sum[k] = (sum[k] || 0) + e[k]; return sum; }, {}));
  return { days: 30, rates, total, shops: shopId ? shops.slice(0, 1) : shops.slice(0, 200) };
}
