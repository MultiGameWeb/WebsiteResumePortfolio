-- Adds the data and routing fields required for Cloudflare-hosted customer websites.
-- One-time migration for a database that has not had these fields added yet.
-- Do not run this file against the current sitecraft-db: its fields and indexes were
-- applied manually in the D1 Console during setup.

ALTER TABLE sites ADD COLUMN slug TEXT;
ALTER TABLE sites ADD COLUMN template_id TEXT NOT NULL DEFAULT '';
ALTER TABLE sites ADD COLUMN selected_features_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE sites ADD COLUMN site_data_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE sites ADD COLUMN owner_token_hash TEXT;
ALTER TABLE sites ADD COLUMN published_at TEXT;

-- Used to deduplicate the same uploaded image when it appears in multiple fields.
ALTER TABLE assets ADD COLUMN content_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_site_content_hash
  ON assets(site_id, content_hash);
