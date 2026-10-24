import { test } from "node:test";
import assert from "node:assert/strict";
import { parseKnowledgeExtraction } from "../knowledge-extraction.js";
import { assessQuestionCoverage } from "../knowledge-coverage.js";
import { buildOwnerInterviewQueue, nextOwnerInterviewQuestion } from "../owner-interview.js";
import { getQuestionBank } from "../question-bank.js";

test("extraction pins facts to server source ID and ignores model-supplied verification", () => {
  const result = parseKnowledgeExtraction(JSON.stringify({ facts: [{
    key: "business.hours",
    value: "9 AM to 9 PM",
    evidence: "open 9 AM to 9 PM",
    confidence: 0.99,
    status: "verified",
    sourceId: "model-forged-source",
  }] }), "source-from-server", "We are open 9 AM to 9 PM daily.");
  assert.equal(result.totalFacts, 1);
  assert.equal(result.facts[0].sourceId, "source-from-server");
  assert.equal(result.facts[0].status, "unverified");
  assert.equal(result.facts[0].evidenceMatched, true);
  assert.equal(result.facts[0].confidence, 0.99);
});

test("evidence absent from original source remains unverified and is flagged", () => {
  const result = parseKnowledgeExtraction(JSON.stringify({ facts: [{
    key: "business.hours", value: "24/7", evidence: "Open every minute forever", status: "verified",
  }] }), "source-1", "We open from 9 AM to 9 PM.");
  assert.equal(result.facts[0].evidenceMatched, false);
  assert.equal(result.facts[0].status, "unverified");
});

test("extraction rejects malformed JSON, missing evidence, bad keys, and excessive facts", () => {
  assert.throws(() => parseKnowledgeExtraction("{bad", "source-1", "text"), /valid JSON/);
  assert.throws(() => parseKnowledgeExtraction(JSON.stringify({ facts: [{ key: "business.hours", value: "9-5" }] }), "source-1", "9-5"), /evidence excerpt/);
  assert.throws(() => parseKnowledgeExtraction(JSON.stringify({ facts: [{ key: "../secret", value: "x", evidence: "text" }] }), "source-1", "text"), /invalid knowledge key/);
  assert.throws(() => parseKnowledgeExtraction(JSON.stringify({ facts: Array.from({ length: 301 }, () => ({ key: "business.hours", value: "9-5", evidence: "9-5" })) }), "source-1", "9-5"), /too many facts/);
});

test("different extracted values for the same key become conflicting instead of choosing one", () => {
  const result = parseKnowledgeExtraction(JSON.stringify({ facts: [
    { key: "business.phone", value: "+91 11111 11111", evidence: "Call +91 11111 11111" },
    { key: "business.phone", value: "+91 22222 22222", evidence: "Call +91 22222 22222" },
  ] }), "source-1", "Call +91 11111 11111 or +91 22222 22222.");
  assert.equal(result.facts.length, 2);
  assert.ok(result.facts.every(f => f.status === "conflicting"));
});

test("currency and punctuation differences remain conflicts instead of being normalized away", () => {
  const result = parseKnowledgeExtraction(JSON.stringify({ facts: [
    { key: "offerings.prices", value: "₹100", evidence: "Item A costs ₹100" },
    { key: "offerings.prices", value: "$100", evidence: "Item B costs $100" },
  ] }), "source-1", "Item A costs ₹100. Item B costs $100.");
  assert.equal(result.facts.length, 2);
  assert.ok(result.facts.every(f => f.status === "conflicting"));
});

test("duplicate same-key values from a source collapse without losing the first evidence", () => {
  const result = parseKnowledgeExtraction(JSON.stringify({ facts: [
    { key: "business.hours", value: "9 AM to 9 PM", evidence: "Open 9 AM to 9 PM" },
    { key: "business.hours", value: "9 AM to 9 PM", evidence: "open 9 am to 9 pm" },
  ] }), "source-1", "Open 9 AM to 9 PM daily.");
  assert.equal(result.facts.length, 1);
  assert.equal(result.facts[0].evidence, "Open 9 AM to 9 PM");
});

test("owner interview queue prioritizes mandatory unresolved items and emits one question", () => {
  const patterns = getQuestionBank("restaurant").filter(item =>
    ["phone_contact", "operating_hours", "email_contact", "business_identity"].includes(item.intent)
  );
  const report = assessQuestionCoverage(patterns, [
    { key: "business.name", value: "Mawa Cafe", status: "owner_confirmed" },
    { key: "business.phone", value: "+91 11111 11111", status: "verified" },
    { key: "business.hours", value: "9 AM to 9 PM", status: "unverified" },
  ]);
  const queue = buildOwnerInterviewQueue(report);
  assert.ok(queue.length >= 1);
  assert.equal(queue[0].requirement, "mandatory");
  assert.equal(queue[0].intent, "operating_hours");
  assert.equal(queue[0].canSkip, false);
  assert.equal(nextOwnerInterviewQuestion(queue)?.questionId, queue[0].questionId);
  assert.equal(nextOwnerInterviewQuestion(queue, new Set(queue.map(item => item.questionId))), null);
});

test("optional owner questions may be skipped but can never become auto-verified", () => {
  const pattern = getQuestionBank("restaurant").find(item => item.intent === "email_contact");
  assert.ok(pattern);
  const report = assessQuestionCoverage([pattern], []);
  const [item] = buildOwnerInterviewQueue(report);
  assert.equal(item.requirement, "optional");
  assert.equal(item.canSkip, true);
  assert.equal(item.canMarkNotApplicable, true);
  assert.match(item.reason, /optional detail/i);
});
