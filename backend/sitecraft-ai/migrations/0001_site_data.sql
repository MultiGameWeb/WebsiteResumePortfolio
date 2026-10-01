PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  business_name TEXT NOT NULL DEFAULT '',
  plan_gb INTEGER NOT NULL DEFAULT 5,
  storage_used_bytes INTEGER NOT NULL DEFAULT 0,
  storage_expires_at TEXT,
  grace_ends_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  lead_type TEXT NOT NULL DEFAULT 'Website Enquiry',
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_leads_site_created
  ON leads(site_id, created_at DESC);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'image',
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assets_site
  ON assets(site_id);

CREATE TABLE IF NOT EXISTS storage_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quota_gb INTEGER NOT NULL,
  price_inr INTEGER NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 365,
  grace_days INTEGER NOT NULL DEFAULT 7,
  video_max_mb INTEGER NOT NULL DEFAULT 50,
  enabled INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO storage_plans(id,name,quota_gb,price_inr,duration_days,grace_days,video_max_mb)
VALUES ('website-5gb','5 GB Website Storage',5,119,365,7,50);

INSERT OR IGNORE INTO storage_plans(id,name,quota_gb,price_inr,duration_days,grace_days,video_max_mb)
VALUES ('website-10gb','10 GB Website Storage',10,199,365,7,50);

INSERT OR IGNORE INTO storage_plans(id,name,quota_gb,price_inr,duration_days,grace_days,video_max_mb)
VALUES ('website-25gb','25 GB Website Storage',25,399,365,7,50);
