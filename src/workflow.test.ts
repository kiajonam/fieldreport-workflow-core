import { canTransition, reportWorkflow } from "./workflow.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  canTransition(reportWorkflow, "draft", "submitted"),
  "draft should transition to submitted",
);

assert(
  !canTransition(reportWorkflow, "draft", "completed"),
  "draft should not transition directly to completed",
);

assert(
  canTransition(reportWorkflow, "under_review", "approved"),
  "under_review should transition to approved",
);

assert(
  canTransition(reportWorkflow, "under_review", "rejected"),
  "under_review should transition to rejected",
);

assert(
  !canTransition(reportWorkflow, "completed", "draft"),
  "completed should be terminal",
);

// @ts-expect-error Invalid source state must be rejected by TypeScript.
canTransition(reportWorkflow, "missing", "submitted");

// @ts-expect-error Invalid target state must be rejected by TypeScript.
canTransition(reportWorkflow, "draft", "missing");

console.log("workflow tests passed");
