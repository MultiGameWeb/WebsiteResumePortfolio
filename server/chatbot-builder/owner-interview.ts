import type { CoverageReport, QuestionCoverage } from "./knowledge-coverage.js";

export interface OwnerInterviewQuestion {
  questionId: string;
  intent: string;
  prompt: string;
  requirement: "mandatory" | "optional";
  coverageStatus: QuestionCoverage["status"];
  canSkip: boolean;
  canMarkNotApplicable: boolean;
  reason: string;
}

const STATUS_PRIORITY: Record<QuestionCoverage["status"], number> = {
  conflicting: 0,
  needs_review: 1,
  missing: 2,
  answerable: 3,
  not_applicable: 4,
};

function reasonFor(item: QuestionCoverage): string {
  switch (item.status) {
    case "conflicting":
      return "The supplied business sources disagree. Confirm the correct current information.";
    case "needs_review":
      return "Information was found, but it has not been verified by the business owner.";
    case "missing":
      return item.requirement === "mandatory"
        ? "This required launch detail was not found in the supplied information."
        : "This optional detail could improve customer answers but is not yet available.";
    default:
      return "Please confirm the business information.";
  }
}

/**
 * Build a deterministic queue from unresolved coverage items.
 * Mandatory questions appear first; within each group conflicts and unverified
 * details precede completely missing details. Original bank order breaks ties.
 */
export function buildOwnerInterviewQueue(report: CoverageReport): OwnerInterviewQuestion[] {
  return report.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.status === "missing" || item.status === "conflicting" || item.status === "needs_review")
    .sort((a, b) =>
      Number(a.item.requirement !== "mandatory") - Number(b.item.requirement !== "mandatory") ||
      STATUS_PRIORITY[a.item.status] - STATUS_PRIORITY[b.item.status] ||
      a.index - b.index
    )
    .map(({ item }) => ({
      questionId: item.questionId,
      intent: item.intent,
      prompt: item.question.trim(),
      requirement: item.requirement,
      coverageStatus: item.status,
      canSkip: item.requirement === "optional",
      canMarkNotApplicable: true,
      reason: reasonFor(item),
    }));
}

/** Return one unanswered question only; UI should advance after saving the owner's response. */
export function nextOwnerInterviewQuestion(
  queue: readonly OwnerInterviewQuestion[],
  completedQuestionIds: ReadonlySet<string> = new Set<string>(),
): OwnerInterviewQuestion | null {
  return queue.find(item => !completedQuestionIds.has(item.questionId)) ?? null;
}
