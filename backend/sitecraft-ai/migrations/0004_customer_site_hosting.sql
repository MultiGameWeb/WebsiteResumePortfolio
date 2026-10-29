-- Adds the data and routing fields required for Cloudflare-hosted customer websites.
-- Run this migration once against the existing sitecraft-db D1 database.

ALTER TABLE sites ADD COLUMN site_data_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE sites ADD COLUMN owner_token_hash TEXT;
ALTER TABLE sites ADD COLUMN published_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);

-- Used to deduplicate the same uploaded image when it appears in both a hero/gallery
-- field and the template admin media library.
ALTER TABLE assets ADD COLUMN content_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_site_content_hash
  ON assets(site_id, content_hash);
