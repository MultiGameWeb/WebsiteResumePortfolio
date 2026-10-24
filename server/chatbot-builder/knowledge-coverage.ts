import type { QuestionPattern, BusinessCategoryId } from "./question-bank.js";

export type KnowledgeFactStatus =
  | "verified" | "owner_confirmed" | "unverified"
  | "conflicting" | "missing" | "not_applicable";

export interface KnowledgeFact {
  key: string;
  value: string | null;
  status: KnowledgeFactStatus;
  sourceId?: string;
  evidence?: string;
}

export type CoverageStatus = "answerable" | "missing" | "conflicting" | "needs_review" | "not_applicable";

export interface QuestionCoverage {
  questionId: string;
  category: BusinessCategoryId;
  intent: string;
  question: string;
  requirement: "mandatory" | "optional";
  status: CoverageStatus;
  matchedFactKeys: string[];
  sourceIds: string[];
}

export interface CoverageReport {
  total: number;
  answerable: number;
  missingMandatory: number;
  missingOptional: number;
  conflicting: number;
  needsReview: number;
  notApplicable: number;
  launchReady: boolean;
  items: QuestionCoverage[];
}

function cleanKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function cleanValue(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/g, " ").trim();
}

function classify(pattern: QuestionPattern, facts: readonly KnowledgeFact[]): QuestionCoverage {
  const keys = new Set(pattern.knowledgeKeys.map(cleanKey));
  const matching = facts.filter(fact => keys.has(cleanKey(fact.key)));
  const populated = matching.filter(fact => typeof fact.value === "string" && fact.value.trim() && fact.status !== "missing" && fact.status !== "not_applicable");
  const distinctValues = new Set(populated.map(fact => cleanValue(fact.value ?? "")));
  let status: CoverageStatus;

  if (matching.some(fact => fact.status === "conflicting") || distinctValues.size > 1) {
    status = "conflicting";
  } else if (populated.some(fact => fact.status === "verified" || fact.status === "owner_confirmed")) {
    status = "answerable";
  } else if (populated.length > 0) {
    status = "needs_review";
  } else if (matching.length > 0 && matching.every(fact => fact.status === "not_applicable")) {
    status = "not_applicable";
  } else {
    status = "missing";
  }

  return {
    questionId: pattern.id,
    category: pattern.category,
    intent: pattern.intent,
    question: pattern.question,
    requirement: pattern.requirement,
    status,
    matchedFactKeys: [...new Set(matching.map(fact => cleanKey(fact.key)))],
    sourceIds: [...new Set(matching.map(fact => fact.sourceId).filter((value): value is string => !!value))],
  };
}

export function assessQuestionCoverage(
  patterns: readonly QuestionPattern[],
  facts: readonly KnowledgeFact[],
): CoverageReport {
  const items = patterns.map(pattern => classify(pattern, facts));
  const answerable = items.filter(item => item.status === "answerable").length;
  const missingMandatory = items.filter(item => item.status === "missing" && item.requirement === "mandatory").length;
  const missingOptional = items.filter(item => item.status === "missing" && item.requirement === "optional").length;
  const conflicting = items.filter(item => item.status === "conflicting").length;
  const needsReview = items.filter(item => item.status === "needs_review").length;
  const notApplicable = items.filter(item => item.status === "not_applicable").length;
  return {
    total: items.length,
    answerable,
    missingMandatory,
    missingOptional,
    conflicting,
    needsReview,
    notApplicable,
    launchReady: items.every(item =>
      item.status === "answerable" || item.status === "not_applicable" ||
      (item.status === "missing" && item.requirement === "optional")
    ),
    items,
  };
}

export function getQuestionsNeedingOwnerInput(report: CoverageReport): QuestionCoverage[] {
  return report.items.filter(item =>
    item.status === "missing" || item.status === "conflicting" || item.status === "needs_review"
  );
}
