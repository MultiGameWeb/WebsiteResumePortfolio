PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ai_jobs (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'awaiting_details',
  form_schema_json TEXT NOT NULL DEFAULT '[]',
  details_json TEXT NOT NULL DEFAULT '{}',
  manifest_json TEXT NOT NULL DEFAULT '{}',
  installed_feature_ids_json TEXT NOT NULL DEFAULT '[]',
  current_price_inr INTEGER NOT NULL DEFAULT 499,
  assembled_html TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_status_updated
  ON ai_jobs(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_feature_state (
  job_id TEXT NOT NULL,
  feature_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'installed',
  price_inr INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'ai',
  added_at TEXT NOT NULL,
  PRIMARY KEY (job_id, feature_id),
  FOREIGN KEY(job_id) REFERENCES ai_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_feature_state_job
  ON ai_feature_state(job_id, state);

CREATE TABLE IF NOT EXISTS ai_suggestion_history (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  feature_id TEXT NOT NULL,
  suggested_at TEXT NOT NULL,
  decision TEXT NOT NULL DEFAULT 'shown',
  UNIQUE(job_id, feature_id),
  FOREIGN KEY(job_id) REFERENCES ai_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_history_job
  ON ai_suggestion_history(job_id, suggested_at ASC);

CREATE TABLE IF NOT EXISTS ai_site_versions (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  version_no INTEGER NOT NULL,
  trigger_feature_id TEXT,
  html TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(job_id, version_no),
  FOREIGN KEY(job_id) REFERENCES ai_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_site_versions_job
  ON ai_site_versions(job_id, version_no DESC);
