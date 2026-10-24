import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { D1DatabaseLike, D1PreparedStatementLike, D1Result } from "../types.js";
import {
  BusinessWorkflowError,
  createBusinessWorkspace,
  processSourceExtraction,
  recalculateBusinessCoverage,
  saveOwnerAnswer,
  savePastedTextSource,
} from "../business-workflow.js";
import { getQuestionBank } from "../question-bank.js";

class SQLiteD1Statement implements D1PreparedStatementLike {
  private values: unknown[] = [];
  constructor(private readonly db: DatabaseSync, private readonly sql: string) {}
  bind(...values: unknown[]): D1PreparedStatementLike {
    this.values = values;
    return this;
  }
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...(this.values as never[]));
    return (row ?? null) as T | null;
  }
  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    try {
      return { success: true, results: this.db.prepare(this.sql).all(...(this.values as never[])) as T[] };
    } catch (error) {
      return { success: false, error: String(error), results: [] };
    }
  }
  async run<T = unknown>(): Promise<D1Result<T>> {
    const result = this.db.prepare(this.sql).run(...(this.values as never[]));
    return { success: true, meta: { changes: Number(result.changes) } };
  }
}

class SQLiteD1 implements D1DatabaseLike {
  readonly native = new DatabaseSync(":memory:");
  constructor() {
    this.native.exec("PRAGMA foreign_keys = ON;");
    this.native.exec(readFileSync("migrations/0001_cb_ai_usage_and_limits.sql", "utf8"));
    this.native.exec(readFileSync("migrations/0002_cb_business_workflow.sql", "utf8"));
  }
  prepare(query: string): D1PreparedStatementLike {
    return new SQLiteD1Statement(this.native, query);
  }
  async batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<D1Result<T>[]> {
    this.native.exec("BEGIN");
    try {
      const results: D1Result<T>[] = [];
      for (const statement of statements) results.push(await statement.run<T>());
      this.native.exec("COMMIT");
      return results;
    } catch (error) {
      this.native.exec("ROLLBACK");
      throw error;
    }
  }
  close(): void {
    this.native.close();
  }
}

async function makeBusiness(db: SQLiteD1, ownerId = "owner-1") {
  return createBusinessWorkspace(db, {
    ownerId,
    businessName: "Mawa Cafe",
    category: "restaurant",
    websiteOrigin: "https://mawa.example/",
  });
}

async function addSource(db: SQLiteD1, businessId: string, text: string, ownerId = "owner-1") {
  return savePastedTextSource(db, { ownerId, businessId, text });
}

function extraction(value: string, evidence: string, key = "business.phone"): string {
  return JSON.stringify({ facts: [{ key, value, evidence, status: "verified", sourceId: "forged-source" }] });
}

test("business workspace creation validates input, pins owner, and creates draft knowledge version 1", async () => {
  const db = new SQLiteD1();
  try {
    const created = await makeBusiness(db);
    const row = db.native.prepare(
      "SELECT owner_id, business_name, website_origin, current_knowledge_version FROM cb_business_workspaces WHERE business_id = ?"
    ).get(created.businessId) as Record<string, unknown>;
    assert.equal(row.owner_id, "owner-1");
    assert.equal(row.business_name, "Mawa Cafe");
    assert.equal(row.website_origin, "https://mawa.example");
    assert.equal(row.current_knowledge_version, 1);
    assert.equal(created.knowledgeVersion, 1);
    await assert.rejects(
      createBusinessWorkspace(db, { ownerId: "owner-1", businessName: "Nope", category: "unexpected" as never }),
      (error: unknown) => error instanceof BusinessWorkflowError && error.code === "INVALID_CATEGORY",
    );
  } finally {
    db.close();
  }
});

test("a pasted source is owner-scoped and extraction evidence is checked against text stored by the server", async () => {
  const db = new SQLiteD1();
  try {
    const created = await makeBusiness(db);
    const source = await addSource(db, created.businessId, "Call +91 11111 11111 for bookings.");
    await assert.rejects(
      savePastedTextSource(db, { ownerId: "owner-2", businessId: created.businessId, text: "private notes" }),
      (error: unknown) => error instanceof BusinessWorkflowError && error.status === 404,
    );
    const result = await processSourceExtraction(db, {
      ownerId: "owner-1",
      businessId: created.businessId,
      sourceId: source.sourceId,
      rawJson: extraction("+91 11111 11111", "Call +91 11111 11111"),
    });
    assert.equal(result.totalFacts, 1);
    assert.equal(result.evidenceNeedsReview, 0);
    const stored = db.native.prepare(
      "SELECT status, source_id FROM cb_knowledge_facts WHERE knowledge_version_id = ?"
    ).get(created.knowledgeVersionId) as Record<string, unknown>;
    assert.equal(stored.status, "unverified");
    assert.equal(stored.source_id, source.sourceId);
    await assert.rejects(
      processSourceExtraction(db, {
        ownerId: "owner-2", businessId: created.businessId, sourceId: source.sourceId,
        rawJson: extraction("private", "private"),
      }),
      (error: unknown) => error instanceof BusinessWorkflowError && error.status === 404,
    );
  } finally {
    db.close();
  }
});

test("evidence mismatch is flagged and facts can never be self-verified by model output", async () => {
  const db = new SQLiteD1();
  try {
    const created = await makeBusiness(db);
    const source = await addSource(db, created.businessId, "We are open from 9 AM to 9 PM.");
    const result = await processSourceExtraction(db, {
      ownerId: "owner-1",
      businessId: created.businessId,
      sourceId: source.sourceId,
      rawJson: extraction("24/7", "Open every minute forever", "business.hours"),
    });
    assert.equal(result.evidenceNeedsReview, 1);
    const record = db.native.prepare(
      "SELECT status FROM cb_knowledge_facts WHERE knowledge_version_id = ?"
    ).get(created.knowledgeVersionId) as { status: string };
    assert.equal(record.status, "unverified");
    const sourceRow = db.native.prepare(
      "SELECT extraction_status FROM cb_business_sources WHERE source_id = ?"
    ).get(source.sourceId) as { extraction_status: string };
    assert.equal(sourceRow.extraction_status, "needs_review");
  } finally {
    db.close();
  }
});

test("conflicting values across sources are persisted as conflicts instead of picking one", async () => {
  const db = new SQLiteD1();
  try {
    const created = await makeBusiness(db);
    const source1 = await addSource(db, created.businessId, "Call +91 11111 11111.");
    const first = await processSourceExtraction(db, {
      ownerId: "owner-1", businessId: created.businessId, sourceId: source1.sourceId,
      rawJson: extraction("+91 11111 11111", "Call +91 11111 11111"),
    });
    assert.equal(first.conflictingFacts, 0);

    const source2 = await addSource(db, created.businessId, "Call +91 22222 22222.");
    const second = await processSourceExtraction(db, {
      ownerId: "owner-1", businessId: created.businessId, sourceId: source2.sourceId,
      rawJson: extraction("+91 22222 22222", "Call +91 22222 22222"),
    });
    assert.equal(second.conflictingFacts, 1);
    const rows = db.native.prepare(
      "SELECT status FROM cb_knowledge_facts WHERE knowledge_version_id = ? AND knowledge_key = 'business.phone'"
    ).all(created.knowledgeVersionId) as Array<{ status: string }>;
    assert.equal(rows.length, 2);
    assert.ok(rows.every(row => row.status === "conflicting"));
  } finally {
    db.close();
  }
});

test("coverage recalculation persists one row per stable category question and returns one owner question", async () => {
  const db = new SQLiteD1();
  try {
    const created = await makeBusiness(db);
    const report = await recalculateBusinessCoverage(db, "owner-1", created.businessId);
    assert.equal(report.total, getQuestionBank("restaurant").length);
    assert.equal(report.launchReady, false);
    assert.ok(report.nextOwnerQuestion);
    assert.equal(report.nextOwnerQuestion.requirement, "mandatory");

    const run = db.native.prepare(
      "SELECT total_questions, launch_ready FROM cb_question_coverage_runs WHERE run_id = ?"
    ).get(report.coverageRunId) as Record<string, number>;
    const items = db.native.prepare(
      "SELECT COUNT(*) AS total FROM cb_question_coverage_items WHERE run_id = ?"
    ).get(report.coverageRunId) as { total: number };
    const business = db.native.prepare(
      "SELECT status FROM cb_business_workspaces WHERE business_id = ?"
    ).get(created.businessId) as { status: string };
    assert.equal(run.total_questions, report.total);
    assert.equal(run.launch_ready, 0);
    assert.equal(items.total, report.total);
    assert.equal(business.status, "needs_owner_input");
  } finally {
    db.close();
  }
});

test("owner answer resolves a disputed key in a new version while preserving old conflict evidence", async () => {
  const db = new SQLiteD1();
  try {
    const created = await makeBusiness(db);
    for (const [phone, proof] of [
      ["+91 11111 11111", "Call +91 11111 11111"],
      ["+91 22222 22222", "Call +91 22222 22222"],
    ]) {
      const source = await addSource(db, created.businessId, proof);
      await processSourceExtraction(db, {
        ownerId: "owner-1", businessId: created.businessId, sourceId: source.sourceId,
        rawJson: extraction(phone, proof),
      });
    }

    const phonePattern = getQuestionBank("restaurant").find(item => item.intent === "phone_contact");
    if (!phonePattern || !phonePattern.knowledgeKeys.includes("business.phone")) {
      throw new Error("Expected phone-contact question to include the business.phone key.");
    }
    const result = await saveOwnerAnswer(db, {
      ownerId: "owner-1",
      businessId: created.businessId,
      questionId: phonePattern.id,
      knowledgeKey: "business.phone",
      answer: "+91 33333 33333",
    });
    assert.equal(result.knowledgeVersion, 2);

    const workspace = db.native.prepare(
      "SELECT current_knowledge_version FROM cb_business_workspaces WHERE business_id = ?"
    ).get(created.businessId) as { current_knowledge_version: number };
    assert.equal(workspace.current_knowledge_version, 2);
    const version2 = db.native.prepare(
      "SELECT knowledge_version_id FROM cb_knowledge_versions WHERE business_id = ? AND version_number = 2"
    ).get(created.businessId) as { knowledge_version_id: string };
    const current = db.native.prepare(
      "SELECT status, value_json FROM cb_knowledge_facts WHERE knowledge_version_id = ? AND knowledge_key = 'business.phone'"
    ).get(version2.knowledge_version_id) as { status: string; value_json: string };
    assert.equal(current.status, "owner_confirmed");
    assert.equal(JSON.parse(current.value_json), "+91 33333 33333");

    const oldRows = db.native.prepare(
      "SELECT status FROM cb_knowledge_facts WHERE knowledge_version_id = ? AND knowledge_key = 'business.phone'"
    ).all(created.knowledgeVersionId) as Array<{ status: string }>;
    assert.equal(oldRows.length, 2);
    assert.ok(oldRows.every(row => row.status === "conflicting"));
  } finally {
    db.close();
  }
});


test("an explicit owner correction replaces a single stale value without deleting its old provenance", async () => {
  const db = new SQLiteD1();
  try {
    const created = await makeBusiness(db);
    const source = await addSource(db, created.businessId, "Call +91 11111 11111.");
    await processSourceExtraction(db, {
      ownerId: "owner-1", businessId: created.businessId, sourceId: source.sourceId,
      rawJson: extraction("+91 11111 11111", "Call +91 11111 11111"),
    });
    const phonePattern = getQuestionBank("restaurant").find(item => item.intent === "phone_contact");
    if (!phonePattern) throw new Error("Expected phone-contact question pattern in restaurant question bank.");

    const result = await saveOwnerAnswer(db, {
      ownerId: "owner-1",
      businessId: created.businessId,
      questionId: phonePattern.id,
      knowledgeKey: "business.phone",
      answer: "+91 44444 44444",
    });
    assert.equal(result.knowledgeVersion, 2);

    const version2 = db.native.prepare(
      "SELECT knowledge_version_id FROM cb_knowledge_versions WHERE business_id = ? AND version_number = 2"
    ).get(created.businessId) as { knowledge_version_id: string };
    const current = db.native.prepare(
      "SELECT status, value_json FROM cb_knowledge_facts WHERE knowledge_version_id = ? AND knowledge_key = 'business.phone'"
    ).get(version2.knowledge_version_id) as { status: string; value_json: string };
    assert.equal(current.status, "owner_confirmed");
    assert.equal(JSON.parse(current.value_json), "+91 44444 44444");

    const old = db.native.prepare(
      "SELECT status, value_json FROM cb_knowledge_facts WHERE knowledge_version_id = ? AND knowledge_key = 'business.phone'"
    ).get(created.knowledgeVersionId) as { status: string; value_json: string };
    assert.equal(old.status, "unverified");
    assert.equal(JSON.parse(old.value_json), "+91 11111 11111");
  } finally {
    db.close();
  }
});
