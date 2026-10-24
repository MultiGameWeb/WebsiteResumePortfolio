-- BotCraft business knowledge and release workflow schema.
-- Additive only: creates cb_* tables; never alters SiteCraft tables or applies itself.
-- Source file bytes belong in private object storage (future R2 binding), not D1.

CREATE TABLE IF NOT EXISTS cb_business_workspaces (
  business_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  business_name TEXT NOT NULL CHECK (length(trim(business_name)) BETWEEN 1 AND 160),
  business_category TEXT NOT NULL CHECK (business_category IN (
    'restaurant', 'hotel', 'retail', 'ecommerce', 'salon', 'education',
    'healthcare', 'real_estate', 'travel', 'professional_services',
    'home_services', 'fitness', 'automotive', 'events', 'pet_services', 'general'
  )),
  website_origin TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'auto',
  status TEXT NOT NULL DEFAULT 'collecting' CHECK (status IN (
    'collecting', 'needs_owner_input', 'review_ready', 'testing',
    'owner_review', 'approved', 'paid', 'released', 'paused', 'archived'
  )),
  current_knowledge_version INTEGER NOT NULL DEFAULT 0 CHECK (current_knowledge_version >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (business_id, owner_id)
);
CREATE INDEX IF NOT EXISTS cb_business_workspaces_owner_updated_idx
  ON cb_business_workspaces (owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS cb_business_sources (
  source_id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'owner_conversation', 'pasted_text', 'text_file', 'pdf', 'image', 'docx', 'xlsx', 'csv', 'website_url'
  )),
  original_name TEXT,
  mime_type TEXT,
  byte_size INTEGER CHECK (byte_size IS NULL OR byte_size BETWEEN 0 AND 20971520),
  sha256_hex TEXT,
  object_key TEXT,
  source_text TEXT,
  extraction_status TEXT NOT NULL DEFAULT 'pending' CHECK (extraction_status IN (
    'pending', 'processing', 'succeeded', 'needs_review', 'failed', 'ignored'
  )),
  extraction_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (business_id, owner_id)
    REFERENCES cb_business_workspaces (business_id, owner_id) ON DELETE CASCADE,
  CHECK (source_text IS NULL OR length(source_text) <= 500000)
);
CREATE INDEX IF NOT EXISTS cb_business_sources_owner_business_idx
  ON cb_business_sources (owner_id, business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cb_business_sources_processing_idx
  ON cb_business_sources (extraction_status, updated_at);

CREATE TABLE IF NOT EXISTS cb_knowledge_versions (
  knowledge_version_id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'superseded')),
  summary TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  approved_at TEXT,
  UNIQUE (business_id, version_number),
  UNIQUE (knowledge_version_id, business_id, owner_id),
  FOREIGN KEY (business_id, owner_id)
    REFERENCES cb_business_workspaces (business_id, owner_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS cb_knowledge_versions_business_idx
  ON cb_knowledge_versions (business_id, version_number DESC);

CREATE TABLE IF NOT EXISTS cb_knowledge_facts (
  fact_id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  knowledge_version_id TEXT NOT NULL,
  knowledge_key TEXT NOT NULL CHECK (length(trim(knowledge_key)) BETWEEN 1 AND 160),
  value_json TEXT NOT NULL CHECK (json_valid(value_json)),
  normalized_value TEXT,
  status TEXT NOT NULL CHECK (status IN (
    'verified', 'owner_confirmed', 'unverified', 'conflicting', 'missing', 'not_applicable'
  )),
  source_id TEXT,
  evidence_text TEXT,
  confidence REAL CHECK (confidence IS NULL OR confidence BETWEEN 0.0 AND 1.0),
  conflict_group TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (knowledge_version_id, business_id, owner_id)
    REFERENCES cb_knowledge_versions (knowledge_version_id, business_id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (source_id, business_id, owner_id)
    REFERENCES cb_business_sources (source_id, business_id, owner_id) ON DELETE RESTRICT,
  CHECK (evidence_text IS NULL OR length(evidence_text) <= 4000)
);
CREATE INDEX IF NOT EXISTS cb_knowledge_facts_lookup_idx
  ON cb_knowledge_facts (business_id, knowledge_version_id, knowledge_key);
CREATE INDEX IF NOT EXISTS cb_knowledge_facts_status_idx
  ON cb_knowledge_facts (business_id, knowledge_version_id, status);
CREATE INDEX IF NOT EXISTS cb_knowledge_facts_conflict_idx
  ON cb_knowledge_facts (business_id, knowledge_version_id, conflict_group);

CREATE TABLE IF NOT EXISTS cb_question_coverage_runs (
  run_id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  knowledge_version_id TEXT NOT NULL,
  question_bank_version TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
  answerable_count INTEGER NOT NULL DEFAULT 0 CHECK (answerable_count >= 0),
  missing_mandatory_count INTEGER NOT NULL DEFAULT 0 CHECK (missing_mandatory_count >= 0),
  missing_optional_count INTEGER NOT NULL DEFAULT 0 CHECK (missing_optional_count >= 0),
  conflicting_count INTEGER NOT NULL DEFAULT 0 CHECK (conflicting_count >= 0),
  needs_review_count INTEGER NOT NULL DEFAULT 0 CHECK (needs_review_count >= 0),
  launch_ready INTEGER NOT NULL DEFAULT 0 CHECK (launch_ready IN (0, 1)),
  created_at TEXT NOT NULL,
  FOREIGN KEY (knowledge_version_id, business_id, owner_id)
    REFERENCES cb_knowledge_versions (knowledge_version_id, business_id, owner_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS cb_question_coverage_business_idx
  ON cb_question_coverage_runs (business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cb_question_coverage_items (
  run_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  category TEXT NOT NULL,
  intent TEXT NOT NULL,
  requirement TEXT NOT NULL CHECK (requirement IN ('mandatory', 'optional')),
  answer_status TEXT NOT NULL CHECK (answer_status IN (
    'answerable', 'missing', 'conflicting', 'needs_review', 'not_applicable'
  )),
  matched_fact_keys_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(matched_fact_keys_json)),
  source_ids_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(source_ids_json)),
  owner_follow_up TEXT,
  owner_answer TEXT,
  owner_answer_status TEXT CHECK (owner_answer_status IS NULL OR owner_answer_status IN (
    'awaiting', 'answered', 'skipped', 'not_applicable', 'needs_clarification'
  )),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (run_id, question_id),
  FOREIGN KEY (run_id) REFERENCES cb_question_coverage_runs (run_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS cb_question_coverage_items_followup_idx
  ON cb_question_coverage_items (run_id, answer_status, requirement);

CREATE TABLE IF NOT EXISTS cb_owner_interviews (
  interview_id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  coverage_run_id TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'paused', 'cancelled')),
  current_question_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (business_id, owner_id)
    REFERENCES cb_business_workspaces (business_id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (coverage_run_id) REFERENCES cb_question_coverage_runs (run_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS cb_owner_interviews_owner_idx
  ON cb_owner_interviews (owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS cb_owner_interview_messages (
  message_id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'assistant', 'system')),
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 12000),
  metadata_json TEXT CHECK (metadata_json IS NULL OR json_valid(metadata_json)),
  created_at TEXT NOT NULL,
  FOREIGN KEY (interview_id) REFERENCES cb_owner_interviews (interview_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS cb_owner_interview_messages_timeline_idx
  ON cb_owner_interview_messages (interview_id, created_at);

CREATE TABLE IF NOT EXISTS cb_bot_versions (
  bot_version_id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  knowledge_version_id TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'testing', 'owner_review', 'approved', 'paid', 'released', 'revoked'
  )),
  config_json TEXT NOT NULL CHECK (json_valid(config_json)),
  config_sha256 TEXT,
  generated_model TEXT,
  created_at TEXT NOT NULL,
  approved_at TEXT,
  released_at TEXT,
  UNIQUE (business_id, version_number),
  FOREIGN KEY (business_id, owner_id)
    REFERENCES cb_business_workspaces (business_id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (knowledge_version_id, business_id, owner_id)
    REFERENCES cb_knowledge_versions (knowledge_version_id, business_id, owner_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS cb_bot_versions_business_idx
  ON cb_bot_versions (business_id, version_number DESC, status);

CREATE TABLE IF NOT EXISTS cb_bot_test_runs (
  test_run_id TEXT PRIMARY KEY,
  bot_version_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'passed', 'failed', 'blocked')),
  total_cases INTEGER NOT NULL DEFAULT 0 CHECK (total_cases >= 0),
  passed_cases INTEGER NOT NULL DEFAULT 0 CHECK (passed_cases >= 0),
  failed_cases INTEGER NOT NULL DEFAULT 0 CHECK (failed_cases >= 0),
  blocked_cases INTEGER NOT NULL DEFAULT 0 CHECK (blocked_cases >= 0),
  results_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(results_json)),
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (bot_version_id) REFERENCES cb_bot_versions (bot_version_id) ON DELETE CASCADE,
  CHECK (passed_cases + failed_cases + blocked_cases <= total_cases)
);
CREATE INDEX IF NOT EXISTS cb_bot_test_runs_version_idx
  ON cb_bot_test_runs (bot_version_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cb_bot_releases (
  release_id TEXT PRIMARY KEY,
  bot_version_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'staged' CHECK (status IN ('staged', 'active', 'paused', 'revoked')),
  allowed_origin TEXT,
  public_slug TEXT UNIQUE,
  qr_object_key TEXT,
  pwa_manifest_json TEXT CHECK (pwa_manifest_json IS NULL OR json_valid(pwa_manifest_json)),
  package_object_key TEXT,
  created_at TEXT NOT NULL,
  activated_at TEXT,
  revoked_at TEXT,
  FOREIGN KEY (bot_version_id) REFERENCES cb_bot_versions (bot_version_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS cb_bot_releases_status_idx
  ON cb_bot_releases (status, created_at DESC);
