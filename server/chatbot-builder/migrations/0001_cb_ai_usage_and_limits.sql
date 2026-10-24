-- D1/SQLite migration for BotCraft only.
-- Creates cb_* tables and indexes in the existing SiteCraft D1 database.
-- Does not alter any existing SiteCraft table.

CREATE TABLE IF NOT EXISTS cb_ai_usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT,
  owner_id TEXT,
  task TEXT NOT NULL CHECK (task IN ('interview', 'extract', 'test', 'chat', 'voice')),
  key_slot INTEGER NOT NULL CHECK (key_slot BETWEEN 1 AND 5),
  model_name TEXT NOT NULL,
  tokens_in INTEGER NOT NULL DEFAULT 0 CHECK (tokens_in >= 0),
  tokens_out INTEGER NOT NULL DEFAULT 0 CHECK (tokens_out >= 0),
  duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_code TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS cb_ai_usage_log_created_at_idx ON cb_ai_usage_log (created_at DESC);
CREATE INDEX IF NOT EXISTS cb_ai_usage_log_key_slot_created_at_idx ON cb_ai_usage_log (key_slot, created_at DESC);
CREATE INDEX IF NOT EXISTS cb_ai_usage_log_task_created_at_idx ON cb_ai_usage_log (task, created_at DESC);
CREATE INDEX IF NOT EXISTS cb_ai_usage_log_owner_created_at_idx ON cb_ai_usage_log (owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cb_rate_counters (
  bucket_key TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cb_rate_counters_updated_at_idx ON cb_rate_counters (updated_at);

CREATE TABLE IF NOT EXISTS cb_key_cooldowns (
  cooldown_key TEXT PRIMARY KEY,
  cooldown_until_ms INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cb_key_cooldowns_expiry_idx ON cb_key_cooldowns (cooldown_until_ms);

CREATE TABLE IF NOT EXISTS cb_ai_reservations (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  task TEXT NOT NULL CHECK (task IN ('interview', 'extract', 'test', 'chat', 'voice')),
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'success', 'failed')),
  created_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS cb_ai_reservations_owner_created_at_idx ON cb_ai_reservations (owner_id, created_at DESC);

-- D1/SQLite is managed by Cloudflare. No Postgres functions, roles, extensions or RLS are used.
