import { parseKnowledgeExtraction } from "./knowledge-extraction.js";
import {
  assessQuestionCoverage,
  type CoverageReport,
  type KnowledgeFact,
} from "./knowledge-coverage.js";
import { buildOwnerInterviewQueue } from "./owner-interview.js";
import { getQuestionBank, QUESTION_BANK_VERSION, type BusinessCategoryId } from "./question-bank.js";
import type { D1DatabaseLike, D1PreparedStatementLike, D1Result } from "./types.js";

const CATEGORIES: readonly BusinessCategoryId[] = [
  "restaurant", "hotel", "retail", "ecommerce", "salon", "education",
  "healthcare", "real_estate", "travel", "professional_services",
  "home_services", "fitness", "automotive", "events", "pet_services", "general",
];
const MAX_SOURCE_CHARS = 500_000;
const MAX_BUSINESS_NAME = 160;
const MAX_LANGUAGE_CHARS = 40;
const MAX_OWNER_ANSWER = 12_000;

export class BusinessWorkflowError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "BusinessWorkflowError";
  }
}

interface BusinessRow {
  business_id: string;
  owner_id: string;
  business_name: string;
  business_category: BusinessCategoryId;
  website_origin: string | null;
  preferred_language: string;
  status: string;
  current_knowledge_version: number;
}

interface VersionRow {
  knowledge_version_id: string;
  business_id: string;
  owner_id: string;
  version_number: number;
  status: "draft" | "review" | "approved" | "superseded";
}

interface StoredFactRow {
  fact_id: string;
  business_id: string;
  owner_id: string;
  knowledge_version_id: string;
  knowledge_key: string;
  value_json: string;
  status: KnowledgeFact["status"];
  source_id: string | null;
  evidence_text: string | null;
  confidence: number | null;
  conflict_group: string | null;
}

interface NewFact {
  key: string;
  value: string;
  status: KnowledgeFact["status"];
  sourceId: string;
  evidence?: string;
  confidence?: number | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new BusinessWorkflowError("INVALID_INPUT", label + " must be text.");
  }
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maxLength) {
    throw new BusinessWorkflowError("INVALID_INPUT", label + " is empty or exceeds its length limit.");
  }
  return cleaned;
}

function normalizeOrigin(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) {
    throw new BusinessWorkflowError("INVALID_ORIGIN", "Website origin must be a valid HTTP(S) origin.");
  }
  try {
    const parsed = new URL(value);
    if (
      !["https:", "http:"].includes(parsed.protocol) ||
      parsed.username || parsed.password ||
      parsed.pathname !== "/" || parsed.search || parsed.hash
    ) {
      throw new Error("not an origin");
    }
    return parsed.origin;
  } catch {
    throw new BusinessWorkflowError("INVALID_ORIGIN", "Website origin must be a valid HTTP(S) origin without a path.");
  }
}

async function checkedFirst<T>(statement: D1PreparedStatementLike): Promise<T | null> {
  return statement.first<T>();
}

async function checkedAll<T>(statement: D1PreparedStatementLike): Promise<T[]> {
  const result = await statement.all<T>();
  if (result.success === false || result.error) {
    throw new BusinessWorkflowError("STORAGE_READ_FAILED", "Business information could not be read safely.", 503);
  }
  return result.results ?? [];
}

async function checkedBatch(db: D1DatabaseLike, statements: D1PreparedStatementLike[]): Promise<void> {
  if (statements.length === 0) return;
  const result = await db.batch(statements);
  if (result.some((item: D1Result) => item.success === false || item.error)) {
    throw new BusinessWorkflowError("STORAGE_WRITE_FAILED", "Business information could not be saved safely.", 503);
  }
}

async function getOwnedBusiness(
  db: D1DatabaseLike,
  ownerId: string,
  businessId: string,
): Promise<BusinessRow> {
  const owner = requiredText(ownerId, "Verified owner ID", 512);
  const id = requiredText(businessId, "Business ID", 200);
  const row = await checkedFirst<BusinessRow>(db.prepare(
    "SELECT business_id, owner_id, business_name, business_category, website_origin, preferred_language, status, current_knowledge_version " +
    "FROM cb_business_workspaces WHERE business_id = ? AND owner_id = ?"
  ).bind(id, owner));
  if (!row) throw new BusinessWorkflowError("BUSINESS_NOT_FOUND", "Business workspace was not found for this signed-in owner.", 404);
  return row;
}

async function getCurrentVersion(db: D1DatabaseLike, business: BusinessRow): Promise<VersionRow | null> {
  if (business.current_knowledge_version < 1) return null;
  return checkedFirst<VersionRow>(db.prepare(
    "SELECT knowledge_version_id, business_id, owner_id, version_number, status " +
    "FROM cb_knowledge_versions WHERE business_id = ? AND owner_id = ? AND version_number = ?"
  ).bind(business.business_id, business.owner_id, business.current_knowledge_version));
}

async function createDraftVersion(
  db: D1DatabaseLike,
  business: BusinessRow,
  current: VersionRow | null,
  excludedKeys: readonly string[] = [],
): Promise<VersionRow> {
  const id = newId();
  const stamp = nowIso();
  const versionNumber = Math.max(1, business.current_knowledge_version + 1);
  const statements: D1PreparedStatementLike[] = [
    db.prepare(
      "INSERT INTO cb_knowledge_versions " +
      "(knowledge_version_id, business_id, owner_id, version_number, status, created_by, created_at) " +
      "VALUES (?, ?, ?, ?, 'draft', ?, ?)"
    ).bind(id, business.business_id, business.owner_id, versionNumber, business.owner_id, stamp),
  ];

  if (current) {
    const excluded = excludedKeys.length
      ? " AND knowledge_key NOT IN (" + excludedKeys.map(() => "?").join(", ") + ")"
      : "";
    const copySql =
      "INSERT INTO cb_knowledge_facts " +
      "(fact_id, business_id, owner_id, knowledge_version_id, knowledge_key, value_json, normalized_value, status, source_id, evidence_text, confidence, conflict_group, reviewed_by, reviewed_at, created_at, updated_at) " +
      "SELECT lower(hex(randomblob(16))), business_id, owner_id, ?, knowledge_key, value_json, normalized_value, status, source_id, evidence_text, confidence, conflict_group, reviewed_by, reviewed_at, ?, ? " +
      "FROM cb_knowledge_facts WHERE business_id = ? AND owner_id = ? AND knowledge_version_id = ?" + excluded;
    statements.push(db.prepare(copySql).bind(
      id, stamp, stamp, business.business_id, business.owner_id, current.knowledge_version_id, ...excludedKeys,
    ));
    if (current.status === "draft" || current.status === "review") {
      statements.push(db.prepare(
        "UPDATE cb_knowledge_versions SET status = 'superseded' WHERE knowledge_version_id = ? AND status IN ('draft', 'review')"
      ).bind(current.knowledge_version_id));
    }
  }

  statements.push(db.prepare(
    "UPDATE cb_business_workspaces SET current_knowledge_version = ?, status = 'collecting', updated_at = ? " +
    "WHERE business_id = ? AND owner_id = ?"
  ).bind(versionNumber, stamp, business.business_id, business.owner_id));

  await checkedBatch(db, statements);
  return {
    knowledge_version_id: id,
    business_id: business.business_id,
    owner_id: business.owner_id,
    version_number: versionNumber,
    status: "draft",
  };
}

async function ensureDraftVersion(db: D1DatabaseLike, business: BusinessRow): Promise<VersionRow> {
  const current = await getCurrentVersion(db, business);
  if (current?.status === "draft") return current;
  return createDraftVersion(db, business, current);
}

function valueSignature(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return (text ?? "").normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/g, " ").trim();
}

function storedValue(row: StoredFactRow): unknown {
  try {
    return JSON.parse(row.value_json) as unknown;
  } catch {
    return row.value_json;
  }
}

async function currentFacts(db: D1DatabaseLike, versionId: string): Promise<StoredFactRow[]> {
  return checkedAll<StoredFactRow>(db.prepare(
    "SELECT fact_id, business_id, owner_id, knowledge_version_id, knowledge_key, value_json, status, source_id, evidence_text, confidence, conflict_group " +
    "FROM cb_knowledge_facts WHERE knowledge_version_id = ? ORDER BY created_at, fact_id"
  ).bind(versionId));
}

async function insertFactsWithConflictDetection(
  db: D1DatabaseLike,
  business: BusinessRow,
  version: VersionRow,
  facts: readonly NewFact[],
): Promise<{ conflictingKeys: string[]; conflictingFacts: number }> {
  if (facts.length === 0) return { conflictingKeys: [], conflictingFacts: 0 };
  const existing = await currentFacts(db, version.knowledge_version_id);
  const keys = [...new Set(facts.map(fact => fact.key))];
  const relevant = existing.filter(row => keys.includes(row.knowledge_key));
  const allByKey = new Map<string, Array<{ signature: string; factId?: string }>>();
  for (const row of relevant) {
    const list = allByKey.get(row.knowledge_key) ?? [];
    if (row.status !== "missing" && row.status !== "not_applicable") {
      list.push({ signature: valueSignature(storedValue(row)), factId: row.fact_id });
    }
    allByKey.set(row.knowledge_key, list);
  }
  for (const fact of facts) {
    const list = allByKey.get(fact.key) ?? [];
    if (fact.status !== "missing" && fact.status !== "not_applicable") {
      list.push({ signature: valueSignature(fact.value) });
    }
    allByKey.set(fact.key, list);
  }

  const conflictGroups = new Map<string, string>();
  for (const [key, values] of allByKey) {
    if (new Set(values.map(value => value.signature)).size > 1) conflictGroups.set(key, newId());
  }

  const stamp = nowIso();
  const statements: D1PreparedStatementLike[] = [];
  for (const [key, groupId] of conflictGroups) {
    statements.push(db.prepare(
      "UPDATE cb_knowledge_facts SET status = 'conflicting', conflict_group = ?, updated_at = ? " +
      "WHERE knowledge_version_id = ? AND knowledge_key = ?"
    ).bind(groupId, stamp, version.knowledge_version_id, key));
  }
  for (const fact of facts) {
    const conflictGroup = conflictGroups.get(fact.key) ?? null;
    const status = conflictGroup ? "conflicting" : fact.status;
    statements.push(db.prepare(
      "INSERT INTO cb_knowledge_facts " +
      "(fact_id, business_id, owner_id, knowledge_version_id, knowledge_key, value_json, normalized_value, status, source_id, evidence_text, confidence, conflict_group, reviewed_by, reviewed_at, created_at, updated_at) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      newId(), business.business_id, business.owner_id, version.knowledge_version_id, fact.key,
      JSON.stringify(fact.value), valueSignature(fact.value), status, fact.sourceId, fact.evidence ?? null,
      fact.confidence ?? null, conflictGroup, fact.reviewedBy ?? null, fact.reviewedAt ?? null, stamp, stamp,
    ));
  }
  await checkedBatch(db, statements);
  const conflictKeys = new Set([
    ...conflictGroups.keys(),
    ...facts.filter(fact => fact.status === "conflicting").map(fact => fact.key),
  ]);
  return {
    conflictingKeys: [...conflictKeys],
    conflictingFacts: facts.filter(fact => conflictKeys.has(fact.key)).length,
  };
}

export interface CreateBusinessInput {
  ownerId: string;
  businessName: string;
  category: BusinessCategoryId;
  websiteOrigin?: string | null;
  preferredLanguage?: string;
}

export interface BusinessWorkspaceCreated {
  businessId: string;
  knowledgeVersionId: string;
  knowledgeVersion: number;
  status: "collecting";
}

export async function createBusinessWorkspace(
  db: D1DatabaseLike,
  input: CreateBusinessInput,
): Promise<BusinessWorkspaceCreated> {
  const ownerId = requiredText(input.ownerId, "Verified owner ID", 512);
  const businessName = requiredText(input.businessName, "Business name", MAX_BUSINESS_NAME);
  if (!CATEGORIES.includes(input.category)) {
    throw new BusinessWorkflowError("INVALID_CATEGORY", "Choose a supported business category.");
  }
  const origin = normalizeOrigin(input.websiteOrigin);
  const language = input.preferredLanguage === undefined
    ? "auto"
    : requiredText(input.preferredLanguage, "Preferred language", MAX_LANGUAGE_CHARS);
  const businessId = newId();
  const versionId = newId();
  const stamp = nowIso();

  await checkedBatch(db, [
    db.prepare(
      "INSERT INTO cb_business_workspaces " +
      "(business_id, owner_id, business_name, business_category, website_origin, preferred_language, status, current_knowledge_version, created_at, updated_at) " +
      "VALUES (?, ?, ?, ?, ?, ?, 'collecting', 1, ?, ?)"
    ).bind(businessId, ownerId, businessName, input.category, origin, language, stamp, stamp),
    db.prepare(
      "INSERT INTO cb_knowledge_versions " +
      "(knowledge_version_id, business_id, owner_id, version_number, status, created_by, created_at) " +
      "VALUES (?, ?, ?, 1, 'draft', ?, ?)"
    ).bind(versionId, businessId, ownerId, ownerId, stamp),
  ]);
  return { businessId, knowledgeVersionId: versionId, knowledgeVersion: 1, status: "collecting" };
}

export interface SaveTextSourceInput {
  ownerId: string;
  businessId: string;
  text: string;
  name?: string;
}

export interface SavedTextSource {
  sourceId: string;
  businessId: string;
  status: "pending";
}

export async function savePastedTextSource(
  db: D1DatabaseLike,
  input: SaveTextSourceInput,
): Promise<SavedTextSource> {
  const business = await getOwnedBusiness(db, input.ownerId, input.businessId);
  const sourceText = requiredText(input.text, "Source text", MAX_SOURCE_CHARS);
  const name = input.name === undefined ? "pasted-notes.txt" : requiredText(input.name, "Source name", 255);
  const sourceId = newId();
  const stamp = nowIso();
  await checkedBatch(db, [db.prepare(
    "INSERT INTO cb_business_sources " +
    "(source_id, business_id, owner_id, source_type, original_name, mime_type, byte_size, source_text, extraction_status, created_at, updated_at) " +
    "VALUES (?, ?, ?, 'pasted_text', ?, 'text/plain', ?, ?, 'pending', ?, ?)"
  ).bind(sourceId, business.business_id, business.owner_id, name, new TextEncoder().encode(sourceText).length, sourceText, stamp, stamp)]);
  return { sourceId, businessId: business.business_id, status: "pending" };
}

export interface ProcessExtractionInput {
  ownerId: string;
  businessId: string;
  sourceId: string;
  rawJson: string;
}

export interface ProcessExtractionResult {
  sourceId: string;
  knowledgeVersion: number;
  totalFacts: number;
  evidenceNeedsReview: number;
  conflictingFacts: number;
}

export async function processSourceExtraction(
  db: D1DatabaseLike,
  input: ProcessExtractionInput,
): Promise<ProcessExtractionResult> {
  const business = await getOwnedBusiness(db, input.ownerId, input.businessId);
  const sourceId = requiredText(input.sourceId, "Source ID", 200);
  const source = await checkedFirst<{ source_id: string; source_text: string | null }>(db.prepare(
    "SELECT source_id, source_text FROM cb_business_sources " +
    "WHERE source_id = ? AND business_id = ? AND owner_id = ?"
  ).bind(sourceId, business.business_id, business.owner_id));
  if (!source || typeof source.source_text !== "string") {
    throw new BusinessWorkflowError("SOURCE_NOT_FOUND", "Source text was not found for this business owner.", 404);
  }

  // Parse against the text fetched from D1, never text or a source ID supplied by the model/client.
  const extraction = parseKnowledgeExtraction(input.rawJson, source.source_id, source.source_text);
  const version = await ensureDraftVersion(db, business);
  const facts: NewFact[] = extraction.facts.map(fact => ({
    key: fact.key,
    value: fact.value ?? "",
    status: fact.status,
    sourceId: source.source_id,
    evidence: fact.evidence,
    confidence: fact.confidence,
  }));
  const conflictResult = await insertFactsWithConflictDetection(db, business, version, facts);

  const evidenceNeedsReview = extraction.facts.filter(fact => !fact.evidenceMatched).length;
  const conflictingFacts = conflictResult.conflictingFacts;
  const sourceStatus = evidenceNeedsReview > 0 || conflictingFacts > 0 ? "needs_review" : "succeeded";
  const stamp = nowIso();
  await checkedBatch(db, [db.prepare(
    "UPDATE cb_business_sources SET extraction_status = ?, extraction_error_code = NULL, updated_at = ? " +
    "WHERE source_id = ? AND business_id = ? AND owner_id = ?"
  ).bind(sourceStatus, stamp, source.source_id, business.business_id, business.owner_id)]);

  return {
    sourceId: source.source_id,
    knowledgeVersion: version.version_number,
    totalFacts: extraction.totalFacts,
    evidenceNeedsReview,
    conflictingFacts,
  };
}

async function loadKnowledgeFacts(db: D1DatabaseLike, versionId: string): Promise<KnowledgeFact[]> {
  const rows = await currentFacts(db, versionId);
  return rows.map(row => ({
    key: row.knowledge_key,
    value: row.status === "missing" || row.status === "not_applicable" ? null : String(storedValue(row)),
    status: row.status,
    sourceId: row.source_id ?? undefined,
    evidence: row.evidence_text ?? undefined,
  }));
}

export interface BusinessCoverageResult extends CoverageReport {
  businessId: string;
  knowledgeVersion: number;
  coverageRunId: string;
  nextOwnerQuestion: ReturnType<typeof buildOwnerInterviewQueue>[number] | null;
}

export async function recalculateBusinessCoverage(
  db: D1DatabaseLike,
  ownerId: string,
  businessId: string,
): Promise<BusinessCoverageResult> {
  const business = await getOwnedBusiness(db, ownerId, businessId);
  const version = await getCurrentVersion(db, business);
  if (!version) throw new BusinessWorkflowError("KNOWLEDGE_VERSION_NOT_FOUND", "Business knowledge has not been initialized.", 409);

  const patterns = getQuestionBank(business.business_category);
  const facts = await loadKnowledgeFacts(db, version.knowledge_version_id);
  const report = assessQuestionCoverage(patterns, facts);
  const runId = newId();
  const stamp = nowIso();
  const matchedFacts = new Map<string, StoredFactRow[]>();
  const storedRows = await currentFacts(db, version.knowledge_version_id);
  for (const item of report.items) {
    matchedFacts.set(item.questionId, storedRows.filter(row => item.matchedFactKeys.includes(row.knowledge_key)));
  }

  const insertChunks: D1PreparedStatementLike[] = [];
  const chunkSize = 40;
  for (let offset = 0; offset < report.items.length; offset += chunkSize) {
    const chunk = report.items.slice(offset, offset + chunkSize);
    const values: unknown[] = [];
    const tuple = "(" + Array.from({ length: 12 }, () => "?").join(", ") + ")";
    for (const item of chunk) {
      const questionFacts = matchedFacts.get(item.questionId) ?? [];
      const confirmed = questionFacts.find(row => row.status === "owner_confirmed");
      const na = item.status === "not_applicable";
      values.push(
        runId, item.questionId, item.category, item.intent, item.requirement, item.status,
        JSON.stringify(item.matchedFactKeys), JSON.stringify(item.sourceIds),
        item.status === "answerable" || na ? null : item.question,
        confirmed ? String(storedValue(confirmed)) : na ? "Not applicable" : null,
        confirmed ? "answered" : na ? "not_applicable" : item.status === "missing" || item.status === "conflicting" || item.status === "needs_review" ? "awaiting" : null,
        stamp,
      );
    }
    const multiValues = chunk.map(() => tuple).join(", ");
    insertChunks.push(db.prepare(
      "INSERT INTO cb_question_coverage_items " +
      "(run_id, question_id, category, intent, requirement, answer_status, matched_fact_keys_json, source_ids_json, owner_follow_up, owner_answer, owner_answer_status, updated_at) VALUES " +
      multiValues
    ).bind(...values));
  }

  const launchStatus = report.launchReady ? "review_ready" : "needs_owner_input";
  const summaryInsert = db.prepare(
    "INSERT INTO cb_question_coverage_runs " +
    "(run_id, business_id, owner_id, knowledge_version_id, question_bank_version, total_questions, answerable_count, missing_mandatory_count, missing_optional_count, conflicting_count, needs_review_count, launch_ready, created_at) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    runId, business.business_id, business.owner_id, version.knowledge_version_id, QUESTION_BANK_VERSION,
    report.total, report.answerable, report.missingMandatory, report.missingOptional,
    report.conflicting, report.needsReview, report.launchReady ? 1 : 0, stamp,
  );
  // One D1 batch keeps the run, all items, and the workflow state change atomic.
  await checkedBatch(db, [
    summaryInsert,
    ...insertChunks,
    db.prepare(
      "UPDATE cb_business_workspaces SET status = ?, updated_at = ? WHERE business_id = ? AND owner_id = ?"
    ).bind(launchStatus, stamp, business.business_id, business.owner_id),
    db.prepare(
      "UPDATE cb_knowledge_versions SET status = ? WHERE knowledge_version_id = ? AND status IN ('draft', 'review')"
    ).bind(report.launchReady ? "review" : "draft", version.knowledge_version_id),
  ]);

  const queue = buildOwnerInterviewQueue(report);
  return {
    ...report,
    businessId: business.business_id,
    knowledgeVersion: version.version_number,
    coverageRunId: runId,
    nextOwnerQuestion: queue[0] ?? null,
  };
}

export interface SaveOwnerAnswerInput {
  ownerId: string;
  businessId: string;
  questionId: string;
  knowledgeKey: string;
  answer?: string;
  notApplicable?: boolean;
}

export interface SaveOwnerAnswerResult {
  sourceId: string;
  knowledgeVersion: number;
  coverage: BusinessCoverageResult;
}

export async function saveOwnerAnswer(
  db: D1DatabaseLike,
  input: SaveOwnerAnswerInput,
): Promise<SaveOwnerAnswerResult> {
  const business = await getOwnedBusiness(db, input.ownerId, input.businessId);
  const questionId = requiredText(input.questionId, "Question ID", 200);
  const knowledgeKey = requiredText(input.knowledgeKey, "Knowledge key", 160).toLowerCase();
  const patterns = getQuestionBank(business.business_category);
  const pattern = patterns.find(item => item.id === questionId);
  if (!pattern || !pattern.knowledgeKeys.includes(knowledgeKey)) {
    throw new BusinessWorkflowError("QUESTION_KEY_MISMATCH", "The selected knowledge key is not part of this business question.", 400);
  }
  const notApplicable = input.notApplicable === true;
  const answer = notApplicable ? "Not applicable" : requiredText(input.answer, "Owner answer", MAX_OWNER_ANSWER);
  if (notApplicable && input.answer && input.answer.trim()) {
    throw new BusinessWorkflowError("INVALID_INPUT", "Do not send an answer when marking a question not applicable.");
  }

  let version = await getCurrentVersion(db, business);
  if (!version) throw new BusinessWorkflowError("KNOWLEDGE_VERSION_NOT_FOUND", "Business knowledge has not been initialized.", 409);

  const existingFacts = await currentFacts(db, version.knowledge_version_id);
  const keyed = existingingFactsForKey(existingFacts, knowledgeKey);
  const signatures = new Set(keyed.filter(row => row.status !== "missing" && row.status !== "not_applicable").map(row => valueSignature(storedValue(row))));
  if (signatures.size > 1 || keyed.some(row => row.status === "conflicting")) {
    // Keep the disputed facts in the old version as an audit trail. The new draft
    // copies unaffected facts and intentionally omits the key the owner is resolving.
    version = await createDraftVersion(db, business, version, [knowledgeKey]);
  } else {
    version = await ensureDraftVersion(db, business);
  }

  const sourceId = newId();
  const stamp = nowIso();
  const sourceText = "Question: " + pattern.question + "\nOwner answer: " + answer;
  const status: KnowledgeFact["status"] = notApplicable ? "not_applicable" : "owner_confirmed";
  const newFact: NewFact = {
    key: knowledgeKey,
    value: answer,
    status,
    sourceId,
    evidence: answer,
    reviewedBy: business.owner_id,
    reviewedAt: stamp,
  };
  await checkedBatch(db, [
    db.prepare(
      "INSERT INTO cb_business_sources " +
      "(source_id, business_id, owner_id, source_type, original_name, mime_type, byte_size, source_text, extraction_status, created_at, updated_at) " +
      "VALUES (?, ?, ?, 'owner_conversation', 'owner-answer.txt', 'text/plain', ?, ?, 'succeeded', ?, ?)"
    ).bind(sourceId, business.business_id, business.owner_id, new TextEncoder().encode(sourceText).length, sourceText, stamp, stamp),
    db.prepare(
      "INSERT INTO cb_knowledge_facts " +
      "(fact_id, business_id, owner_id, knowledge_version_id, knowledge_key, value_json, normalized_value, status, source_id, evidence_text, confidence, conflict_group, reviewed_by, reviewed_at, created_at, updated_at) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)"
    ).bind(
      newId(), business.business_id, business.owner_id, version.knowledge_version_id,
      knowledgeKey, JSON.stringify(answer), valueSignature(answer), status, sourceId, answer,
      business.owner_id, stamp, stamp, stamp,
    ),
  ]);

  const coverage = await recalculateBusinessCoverage(db, business.owner_id, business.business_id);
  return { sourceId, knowledgeVersion: version.version_number, coverage };
}

function existingingFactsForKey(rows: readonly StoredFactRow[], key: string): StoredFactRow[] {
  return rows.filter(row => row.knowledge_key === key);
}
