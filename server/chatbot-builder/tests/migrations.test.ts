import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const migration1 = readFileSync("migrations/0001_cb_ai_usage_and_limits.sql", "utf8");
const migration2 = readFileSync("migrations/0002_cb_business_workflow.sql", "utf8");

function createDatabase(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(migration1);
  db.exec(migration2);
  return db;
}

function seedCore(db: DatabaseSync): void {
  db.prepare(`INSERT INTO cb_business_workspaces
    (business_id, owner_id, business_name, business_category, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .run("business-1", "owner-1", "Mawa Cafe", "restaurant", "2026-10-24T00:00:00Z", "2026-10-24T00:00:00Z");

  db.prepare(`INSERT INTO cb_knowledge_versions
    (knowledge_version_id, business_id, owner_id, version_number, status, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run("knowledge-1", "business-1", "owner-1", 1, "draft", "owner-1", "2026-10-24T00:00:00Z");
}

test("both additive BotCraft migrations apply and are idempotent in SQLite", () => {
  const db = createDatabase();
  try {
    db.exec(migration1);
    db.exec(migration2);
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'cb_%'").all() as Array<{ name: string }>;
    const names = new Set(rows.map(row => row.name));
    for (const name of [
      "cb_ai_usage_log", "cb_rate_counters", "cb_key_cooldowns", "cb_ai_reservations",
      "cb_business_workspaces", "cb_business_sources", "cb_knowledge_versions",
      "cb_knowledge_facts", "cb_question_coverage_runs", "cb_question_coverage_items",
      "cb_owner_interviews", "cb_owner_interview_messages", "cb_bot_versions",
      "cb_bot_test_runs", "cb_bot_releases",
    ]) assert.ok(names.has(name), `expected table ${name}`);
  } finally {
    db.close();
  }
});

test("knowledge facts must belong to the same owner/business/version and retain source provenance", () => {
  const db = createDatabase();
  try {
    seedCore(db);
    db.prepare(`INSERT INTO cb_business_sources
      (source_id, business_id, owner_id, source_type, source_text, extraction_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run("source-1", "business-1", "owner-1", "pasted_text", "Hours: 9 AM–9 PM", "succeeded", "2026-10-24T00:00:00Z", "2026-10-24T00:00:00Z");

    db.prepare(`INSERT INTO cb_knowledge_facts
      (fact_id, business_id, owner_id, knowledge_version_id, knowledge_key, value_json, normalized_value, status, source_id, evidence_text, confidence, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run("fact-1", "business-1", "owner-1", "knowledge-1", "business.hours", JSON.stringify("9 AM–9 PM"), "9 am-9 pm", "verified", "source-1", "Hours: 9 AM–9 PM", 0.98, "2026-10-24T00:00:00Z", "2026-10-24T00:00:00Z");

    assert.throws(() => db.prepare(`INSERT INTO cb_knowledge_facts
      (fact_id, business_id, owner_id, knowledge_version_id, knowledge_key, value_json, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run("fact-other-owner", "business-1", "owner-2", "knowledge-1", "business.hours", JSON.stringify("always open"), "verified", "2026-10-24T00:00:00Z", "2026-10-24T00:00:00Z"));
    const fact = db.prepare("SELECT status, source_id, evidence_text FROM cb_knowledge_facts WHERE fact_id = ?").get("fact-1") as Record<string, unknown>;
    assert.equal(fact.status, "verified");
    assert.equal(fact.source_id, "source-1");
    assert.equal(fact.evidence_text, "Hours: 9 AM–9 PM");
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
  }
});

test("coverage, owner interview, tested bot version, and release lifecycle persist consistently", () => {
  const db = createDatabase();
  try {
    seedCore(db);
    db.prepare(`INSERT INTO cb_question_coverage_runs
      (run_id, business_id, owner_id, knowledge_version_id, question_bank_version, total_questions, answerable_count, missing_mandatory_count, missing_optional_count, conflicting_count, needs_review_count, launch_ready, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run("coverage-1", "business-1", "owner-1", "knowledge-1", "2026-10-24.1", 2, 1, 1, 0, 0, 0, 0, "2026-10-24T00:00:00Z");

    db.prepare(`INSERT INTO cb_question_coverage_items
      (run_id, question_id, category, intent, requirement, answer_status, matched_fact_keys_json, source_ids_json, owner_follow_up, owner_answer_status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run("coverage-1", "restaurant.operating_hours", "restaurant", "operating_hours", "mandatory", "missing", "[]", "[]", "What are your opening hours?", "awaiting", "2026-10-24T00:00:00Z");

    db.prepare(`INSERT INTO cb_owner_interviews
      (interview_id, business_id, owner_id, coverage_run_id, status, current_question_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run("interview-1", "business-1", "owner-1", "coverage-1", "open", "restaurant.operating_hours", "2026-10-24T00:00:00Z", "2026-10-24T00:00:00Z");

    db.prepare(`INSERT INTO cb_owner_interview_messages
      (message_id, interview_id, role, content, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run("message-1", "interview-1", "assistant", "What are your opening hours?", JSON.stringify({ questionId: "restaurant.operating_hours" }), "2026-10-24T00:00:00Z");

    db.prepare(`INSERT INTO cb_bot_versions
      (bot_version_id, business_id, owner_id, knowledge_version_id, version_number, status, config_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run("bot-1", "business-1", "owner-1", "knowledge-1", 1, "testing", JSON.stringify({ schemaVersion: 1 }), "2026-10-24T00:00:00Z");

    db.prepare(`INSERT INTO cb_bot_test_runs
      (test_run_id, bot_version_id, status, total_cases, passed_cases, failed_cases, blocked_cases, results_json, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run("test-1", "bot-1", "passed", 2, 2, 0, 0, JSON.stringify([{ id: "q1", status: "passed" }]), "2026-10-24T00:00:00Z", "2026-10-24T00:01:00Z");

    db.prepare(`INSERT INTO cb_bot_releases
      (release_id, bot_version_id, status, allowed_origin, public_slug, qr_object_key, pwa_manifest_json, package_object_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run("release-1", "bot-1", "staged", "https://example.com", "cafe-abc123", "qr/release-1.png", JSON.stringify({ name: "Mawa Cafe Assistant" }), "packages/release-1.zip", "2026-10-24T00:00:00Z");

    const messageCount = db.prepare("SELECT count(*) AS n FROM cb_owner_interview_messages WHERE interview_id = ?").get("interview-1") as { n: number };
    const itemCount = db.prepare("SELECT count(*) AS n FROM cb_question_coverage_items WHERE run_id = ?").get("coverage-1") as { n: number };
    assert.equal(messageCount.n, 1);
    assert.equal(itemCount.n, 1);
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
  }
});

test("database constraints reject invalid status and malformed JSON", () => {
  const db = createDatabase();
  try {
    seedCore(db);
    assert.throws(() => db.prepare(`INSERT INTO cb_business_workspaces
      (business_id, owner_id, business_name, business_category, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run("business-bad", "owner-1", "Bad Category", "unknown-category", "collecting", "t", "t"));

    assert.throws(() => db.prepare(`INSERT INTO cb_bot_versions
      (bot_version_id, business_id, owner_id, knowledge_version_id, version_number, status, config_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run("bot-bad", "business-1", "owner-1", "knowledge-1", 1, "draft", "{nope", "t"));
  } finally {
    db.close();
  }
});
