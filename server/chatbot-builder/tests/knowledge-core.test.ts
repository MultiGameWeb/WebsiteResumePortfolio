import { test } from "node:test";
import assert from "node:assert/strict";
import {
  QUESTION_BANK, QUESTION_BANK_VERSION, getQuestionBank,
  selectQuestionPatterns, deduplicateQuestionPatterns,
} from "../question-bank.js";
import { assessQuestionCoverage, getQuestionsNeedingOwnerInput } from "../knowledge-coverage.js";
import type { KnowledgeFact } from "../knowledge-coverage.js";

test("question bank contains more than 500 stable category-scoped patterns", () => {
  assert.equal(QUESTION_BANK.length, 560);
  assert.equal(new Set(QUESTION_BANK.map(item => item.id)).size, QUESTION_BANK.length);
  assert.ok(QUESTION_BANK_VERSION.length > 0);
  assert.equal(getQuestionBank("restaurant").length, 35);
});

test("multi-category selection removes repeat intents", () => {
  const selected = selectQuestionPatterns(["restaurant", "hotel"]);
  assert.equal(selected.length, 35);
  assert.equal(new Set(selected.map(item => item.intent)).size, selected.length);
});

test("deduplicator removes duplicate normalized questions but preserves distinct questions", () => {
  const selected = getQuestionBank("restaurant").slice(0, 3);
  const deduped = deduplicateQuestionPatterns([...selected, selected[0], {
    ...selected[1],
    id: "restaurant.duplicate-wording",
    question: "  "+selected[1].question.toUpperCase().replace("?", " ? ")+" ",
  }]);
  assert.equal(deduped.length, 3);
});

test("coverage distinguishes verified answers, missing mandatory facts, and optional gaps", () => {
  const patterns = getQuestionBank("restaurant").filter(item =>
    ["business_identity", "main_offerings", "email_contact"].includes(item.intent)
  );
  const facts: KnowledgeFact[] = [
    { key: "business.name", value: "Mawa Cafe", status: "owner_confirmed", sourceId: "owner-interview-1" },
    { key: "business.offerings", value: "Breakfast and coffee", status: "verified", sourceId: "menu.pdf:p1" },
  ];
  const report = assessQuestionCoverage(patterns, facts);
  assert.equal(report.answerable, 2);
  assert.equal(report.missingMandatory, 0);
  assert.equal(report.missingOptional, 1);
  assert.equal(report.launchReady, true);
  assert.equal(getQuestionsNeedingOwnerInput(report).length, 1);
});

test("coverage blocks launch on conflicting facts or unverified mandatory information", () => {
  const pattern = getQuestionBank("restaurant").find(item => item.intent === "phone_contact");
  assert.ok(pattern);
  const conflict = assessQuestionCoverage([pattern], [
    { key: "business.phone", value: "+91 11111 11111", status: "verified" },
    { key: "business.phone", value: "+91 22222 22222", status: "owner_confirmed" },
  ]);
  assert.equal(conflict.conflicting, 1);
  assert.equal(conflict.launchReady, false);

  const unverified = assessQuestionCoverage([pattern], [
    { key: "business.phone", value: "+91 33333 33333", status: "unverified" },
  ]);
  assert.equal(unverified.needsReview, 1);
  assert.equal(unverified.launchReady, false);
});

test("owner-confirmed not-applicable entries count as resolved without inventing an answer", () => {
  const pattern = getQuestionBank("ecommerce").find(item => item.intent === "location");
  assert.ok(pattern);
  const report = assessQuestionCoverage([pattern], [
    { key: "business.address", value: null, status: "not_applicable" },
    { key: "business.map_url", value: null, status: "not_applicable" },
  ]);
  assert.equal(report.notApplicable, 1);
  assert.equal(report.launchReady, true);
});
