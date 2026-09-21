import {
  canTransition,
  createWorkflowInstance,
  getAvailableTransitions,
  reportWorkflow,
  transition,
} from "./workflow.js";

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

assert(
  getAvailableTransitions(reportWorkflow, "draft").length === 1 &&
    getAvailableTransitions(reportWorkflow, "draft")[0] === "submitted",
  "draft should have submitted as its only available transition",
);

assert(
  getAvailableTransitions(reportWorkflow, "under_review").length === 2 &&
    getAvailableTransitions(reportWorkflow, "under_review")[0] === "approved" &&
    getAvailableTransitions(reportWorkflow, "under_review")[1] === "rejected",
  "under_review should expose approved and rejected",
);

assert(
  getAvailableTransitions(reportWorkflow, "completed").length === 0,
  "completed should have no available transitions",
);

assert(
  transition(reportWorkflow, "draft", "submitted") === "submitted",
  "transition should return the target state",
);

let invalidTransitionRejected = false;

try {
  transition(reportWorkflow, "draft", "completed");
} catch (error) {
  invalidTransitionRejected =
    error instanceof Error &&
    error.message === "Invalid workflow transition: draft -> completed";
}

assert(
  invalidTransitionRejected,
  "invalid transitions should throw an error",
);

const instance = createWorkflowInstance(reportWorkflow);

assert(instance.state === "draft", "instance should start at the initial state");
assert(!instance.isCompleted(), "draft should not be completed");

assert(
  instance.getAvailableTransitions().length === 1 &&
    instance.getAvailableTransitions()[0] === "submitted",
  "instance should expose transitions for its current state",
);
assert(
  instance.canTransition("submitted"),
  "instance should allow a valid transition",
);

assert(
  instance.transition("submitted") === "submitted",
  "instance transition should return the new state",
);
assert(instance.state === "submitted", "instance state should be updated");
assert(!instance.isCompleted(), "submitted should not be completed");

assert(
  instance.transition("under_review") === "under_review",
  "instance should support sequential transitions",
);
assert(instance.state === "under_review", "instance should track the current state");
assert(
  instance.canTransition("approved"),
  "instance should expose approved from under_review",
);
assert(
  instance.canTransition("rejected"),
  "instance should expose rejected from under_review",
);
assert(!instance.isCompleted(), "under_review should not be completed");

let instanceInvalidTransitionRejected = false;

try {
  instance.transition("completed");
} catch (error) {
  instanceInvalidTransitionRejected =
    error instanceof Error &&
    error.message === "Invalid workflow transition: under_review -> completed";
}

assert(
  instanceInvalidTransitionRejected,
  "instance should reject invalid transitions",
);
assert(
  instance.state === "under_review",
  "failed transition should not change instance state",
);

instance.transition("approved");
assert(instance.state === "approved", "instance should reach approved");

instance.transition("completed");
assert(instance.state === "completed", "instance should reach completed");
assert(instance.isCompleted(), "completed should be detected as terminal");

function typeSafetyChecks(): void {
  // @ts-expect-error Invalid source state must be rejected by TypeScript.
  canTransition(reportWorkflow, "missing", "submitted");

  // @ts-expect-error Invalid target state must be rejected by TypeScript.
  canTransition(reportWorkflow, "draft", "missing");

  // @ts-expect-error Invalid state must be rejected by TypeScript.
  getAvailableTransitions(reportWorkflow, "missing");

  // @ts-expect-error Invalid source state must be rejected by TypeScript.
  transition(reportWorkflow, "missing", "submitted");

  // @ts-expect-error Invalid target state must be rejected by TypeScript.
  transition(reportWorkflow, "draft", "missing");

  // @ts-expect-error Invalid target state must be rejected by the instance API.
  createWorkflowInstance(reportWorkflow).transition("missing");
}

console.log("workflow tests passed");
