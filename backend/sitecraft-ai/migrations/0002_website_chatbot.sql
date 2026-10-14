PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS website_chatbot_sites (
  site_id TEXT PRIMARY KEY,
  allowed_origin TEXT NOT NULL,
  business_name TEXT NOT NULL DEFAULT '',
  system_instructions TEXT NOT NULL DEFAULT '',
  daily_message_limit INTEGER NOT NULL DEFAULT 100,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS website_chatbot_usage (
  site_id TEXT NOT NULL,
  usage_day TEXT NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site_id, usage_day),
  FOREIGN KEY (site_id) REFERENCES website_chatbot_sites(site_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS website_chatbot_rate_limits (
  rate_key TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  window_start_ms INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (site_id) REFERENCES website_chatbot_sites(site_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_website_chatbot_usage_day
  ON website_chatbot_usage(usage_day);
