-- BotCraft data model (Phase 1). See docs/BOTCRAFT_CONCEPT.md.
PRAGMA foreign_keys = ON;

-- One row per shop bot. Created when an owner starts chatting with BotCraft.
CREATE TABLE IF NOT EXISTS botcraft_shops (
  shop_id TEXT PRIMARY KEY,
  owner_id TEXT,                       -- set once owner login exists (Phase 3)
  owner_name TEXT NOT NULL DEFAULT '',
  shop_name TEXT NOT NULL DEFAULT '',
  shop_type TEXT NOT NULL DEFAULT '',  -- normalized key, e.g. 'jewellery'
  city TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'live', 'paused')),
  question_bank_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (question_bank_id) REFERENCES botcraft_question_banks(bank_id)
);

-- Gemini-generated question banks, reused across shops of the same type.
CREATE TABLE IF NOT EXISTS botcraft_question_banks (
  bank_id TEXT PRIMARY KEY,
  shop_type TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  model TEXT NOT NULL DEFAULT '',
  question_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE (shop_type, version)
);

CREATE TABLE IF NOT EXISTS botcraft_questions (
  question_id TEXT PRIMARY KEY,
  bank_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  question_text TEXT NOT NULL,          -- what BotCraft asks the owner
  customer_question TEXT NOT NULL DEFAULT '', -- how a customer would ask the bot
  priority TEXT NOT NULL DEFAULT 'optional'
    CHECK (priority IN ('mandatory', 'important', 'optional')),
  answer_type TEXT NOT NULL DEFAULT 'text'
    CHECK (answer_type IN ('text', 'options', 'yes_no', 'number', 'price', 'image', 'list')),
  options_json TEXT NOT NULL DEFAULT '[]',
  why_customers_ask TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (bank_id) REFERENCES botcraft_question_banks(bank_id) ON DELETE CASCADE
);

-- A shop's answer to each question. Auto-filled answers wait for owner
-- confirmation when confidence is low.
CREATE TABLE IF NOT EXISTS botcraft_answers (
  shop_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer_text TEXT NOT NULL DEFAULT '',
  answer_json TEXT NOT NULL DEFAULT 'null',
  source TEXT NOT NULL DEFAULT 'owner'
    CHECK (source IN ('owner', 'auto_fill')),
  confidence REAL,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('needs_confirmation', 'confirmed', 'skipped')),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (shop_id, question_id),
  FOREIGN KEY (shop_id) REFERENCES botcraft_shops(shop_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES botcraft_questions(question_id) ON DELETE CASCADE
);

-- Item cards shown to customers: photo, name, price and details.
CREATE TABLE IF NOT EXISTS botcraft_products (
  product_id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  price_text TEXT NOT NULL DEFAULT '',  -- as the owner wrote it, e.g. "₹45,000 + making"
  price_amount INTEGER,                 -- in paise, when a single number is known
  details_json TEXT NOT NULL DEFAULT '{}',
  stock_status TEXT NOT NULL DEFAULT 'in_stock'
    CHECK (stock_status IN ('in_stock', 'out_of_stock', 'unknown')),
  source TEXT NOT NULL DEFAULT 'owner'
    CHECK (source IN ('owner', 'auto_fill')),
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('needs_confirmation', 'confirmed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (shop_id) REFERENCES botcraft_shops(shop_id) ON DELETE CASCADE
);

-- Files the owner sends (stored in R2): product photos, price lists, catalogues.
CREATE TABLE IF NOT EXISTS botcraft_media (
  media_id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  product_id TEXT,
  r2_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'document')),
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  original_name TEXT NOT NULL DEFAULT '',
  extraction_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (extraction_status IN ('pending', 'done', 'failed')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (shop_id) REFERENCES botcraft_shops(shop_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES botcraft_products(product_id) ON DELETE SET NULL
);

-- The owner's conversation with BotCraft, so setup can continue later.
CREATE TABLE IF NOT EXISTS botcraft_builder_messages (
  message_id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'botcraft')),
  text TEXT NOT NULL DEFAULT '',
  media_ids_json TEXT NOT NULL DEFAULT '[]',
  question_id TEXT,                     -- the question this message asked or answered
  created_at TEXT NOT NULL,
  FOREIGN KEY (shop_id) REFERENCES botcraft_shops(shop_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_botcraft_questions_bank ON botcraft_questions(bank_id, priority, sort_order);
CREATE INDEX IF NOT EXISTS idx_botcraft_answers_status ON botcraft_answers(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_botcraft_products_shop ON botcraft_products(shop_id, category);
CREATE INDEX IF NOT EXISTS idx_botcraft_media_shop ON botcraft_media(shop_id);
CREATE INDEX IF NOT EXISTS idx_botcraft_messages_shop ON botcraft_builder_messages(shop_id, created_at);
