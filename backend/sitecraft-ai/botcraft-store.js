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
  )`
];

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
