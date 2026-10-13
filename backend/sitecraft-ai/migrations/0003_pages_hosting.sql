PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS hosting_deployments (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL DEFAULT '',
  project_name TEXT NOT NULL UNIQUE,
  cloudflare_project_id TEXT,
  hosting_url TEXT,
  custom_domain TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  deployment_type TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hosting_deployments_status
  ON hosting_deployments(status, updated_at DESC);
