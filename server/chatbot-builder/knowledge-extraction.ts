import type { KnowledgeFact } from "./knowledge-coverage.js";

export interface ExtractedKnowledgeFact extends KnowledgeFact {
  /** Evidence was found in the original source text; this is not proof that the claim is true. */
  evidenceMatched: boolean;
  /** Model-reported confidence is advisory only and never establishes verification. */
  confidence: number | null;
}

export interface ExtractionResult {
  facts: ExtractedKnowledgeFact[];
  sourceId: string;
  totalFacts: number;
}

const MAX_FACTS = 300;
const MAX_KEY_CHARS = 160;
const MAX_VALUE_CHARS = 10000;
const MAX_EVIDENCE_CHARS = 2000;
const KEY_PATTERN = /^[a-z][a-z0-9_.-]{1,159}$/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function normalizeEvidence(value: string): string {
  return value.normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function valueToString(value: unknown): string {
  if (value === null || value === undefined) throw new Error("Fact value must not be null or missing.");
  const text = typeof value === "string" ? value.trim() : JSON.stringify(value);
  if (!text || text.length > MAX_VALUE_CHARS) throw new Error("Fact value is empty or too large.");
  return text;
}

function confidenceValue(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("Fact confidence must be a number from 0 to 1.");
  }
  return value;
}

function valueSignature(value: string): string {
  // Unlike evidence matching, conflict detection must preserve meaningful
  // currency symbols, decimals, separators, units, and punctuation.
  return value.normalize("NFKC").toLocaleLowerCase("en").replace(/\\s+/g, " ").trim();
}

/**
 * Validate untrusted model output and pin every fact to a source ID supplied by
 * the server. The model cannot self-approve facts: incoming status fields are
 * deliberately ignored and all non-conflicting facts start as "unverified".
 */
export function parseKnowledgeExtraction(
  rawJson: string,
  sourceId: string,
  originalSourceText: string,
): ExtractionResult {
  if (!sourceId.trim() || sourceId.length > 200) throw new Error("A trusted source ID is required.");
  if (typeof rawJson !== "string" || rawJson.length > 2_000_000) throw new Error("Extraction response is too large.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("Extraction response is not valid JSON.");
  }
  const root = asRecord(parsed);
  if (!root || !Array.isArray(root.facts)) throw new Error("Extraction response must contain a facts array.");
  if (root.facts.length > MAX_FACTS) throw new Error("Extraction response contains too many facts.");

  const normalizedSource = normalizeEvidence(originalSourceText);
  const facts: ExtractedKnowledgeFact[] = root.facts.map((rawFact, index) => {
    const fact = asRecord(rawFact);
    if (!fact) throw new Error(`Fact ${index + 1} must be an object.`);
    if (typeof fact.key !== "string" || fact.key.length > MAX_KEY_CHARS || !KEY_PATTERN.test(fact.key.trim())) {
      throw new Error(`Fact ${index + 1} has an invalid knowledge key.`);
    }
    const key = fact.key.trim().toLowerCase();
    const value = valueToString(fact.value);
    if (typeof fact.evidence !== "string" || !fact.evidence.trim() || fact.evidence.length > MAX_EVIDENCE_CHARS) {
      throw new Error(`Fact ${index + 1} must include a short source-evidence excerpt.`);
    }
    const evidence = fact.evidence.trim();
    const normalizedQuote = normalizeEvidence(evidence);
    const evidenceMatched = normalizedQuote.length >= 4 && normalizedSource.includes(normalizedQuote);
    return {
      key,
      value,
      sourceId,
      evidence,
      evidenceMatched,
      confidence: confidenceValue(fact.confidence),
      status: "unverified",
    };
  });

  // Repeated key/value pairs from one source are collapsed. Distinct values for
  // a single-valued key are marked conflicting instead of silently choosing one.
  const unique: ExtractedKnowledgeFact[] = [];
  const seenExact = new Set<string>();
  for (const fact of facts) {
    const exactKey = [fact.key, valueSignature(fact.value ?? ""), sourceId].join("\u0000");
    if (seenExact.has(exactKey)) continue;
    seenExact.add(exactKey);
    unique.push(fact);
  }

  const valuesByKey = new Map<string, Set<string>>();
  for (const fact of unique) {
    if (fact.value === null) continue;
    const values = valuesByKey.get(fact.key) ?? new Set<string>();
    values.add(valueSignature(fact.value));
    valuesByKey.set(fact.key, values);
  }

  for (const fact of unique) {
    fact.status = (valuesByKey.get(fact.key)?.size ?? 0) > 1 ? "conflicting" : "unverified";
  }

  return { facts: unique, sourceId, totalFacts: unique.length };
}
