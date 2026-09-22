import {
  InvalidWorkflowTransitionError,
  canTransition,
  createWorkflowInstance,
  createWorkflowTransitionEvent,
  getAvailableTransitions,
  transition,
  transitionWithEvent,
  type WorkflowDefinition,
  type WorkflowTransitionEvent,
} from "./workflow.js";

const reportWorkflow: WorkflowDefinition<
  "draft" | "submitted" | "under_review" | "approved" | "rejected" | "completed"
> = {
  id: "report",
  version: 1,
  initialState: "draft",
  transitions: {
    draft: ["submitted"],
    submitted: ["under_review"],
    under_review: ["approved", "rejected"],
    approved: ["completed"],
    rejected: ["draft"],
    completed: [],
  },
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const transitionEvent = createWorkflowTransitionEvent(
  reportWorkflow,
  "draft",
  "submitted",
);

const contextualTransitionEvent = createWorkflowTransitionEvent(
  reportWorkflow,
  "draft",
  "submitted",
  {
    actorId: "user-123",
    source: "api",
  },
);

assert(
  contextualTransitionEvent.context?.actorId === "user-123" &&
    contextualTransitionEvent.context?.source === "api",
  "workflow transition event should preserve transition context",
);

const contextualTransitionResult = transitionWithEvent(
  reportWorkflow,
  "draft",
  "submitted",
  {
    actorId: "user-456",
    source: "system",
  },
);

assert(
  contextualTransitionResult.event.context?.actorId === "user-456" &&
    contextualTransitionResult.event.context?.source === "system",
  "transitionWithEvent should preserve transition context",
);

assert(
  transitionEvent.type === "workflow.transitioned" &&
    transitionEvent.workflowId === "report" &&
    transitionEvent.workflowVersion === 1 &&
    transitionEvent.from === "draft" &&
    transitionEvent.to === "submitted",
  "workflow transition event should contain the transition contract",
);

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

const transitionWithEventResult = transitionWithEvent(
  reportWorkflow,
  "draft",
  "submitted",
);

assert(
  transitionWithEventResult.state === "submitted" &&
    transitionWithEventResult.event.type === "workflow.transitioned" &&
    transitionWithEventResult.event.from === "draft" &&
    transitionWithEventResult.event.to === "submitted",
  "transitionWithEvent should return the new state and transition event",
);

let transitionWithEventInvalidRejected = false;

try {
  transitionWithEvent(reportWorkflow, "draft", "completed");
} catch (error) {
  transitionWithEventInvalidRejected =
    error instanceof InvalidWorkflowTransitionError &&
    error.message === "Invalid workflow transition: draft -> completed";
}

assert(
  transitionWithEventInvalidRejected,
  "transitionWithEvent should reject invalid transitions",
);

let invalidTransitionRejected = false;

try {
  transition(reportWorkflow, "draft", "completed");
} catch (error) {
  invalidTransitionRejected =
    error instanceof InvalidWorkflowTransitionError &&
    error.message === "Invalid workflow transition: draft -> completed";
}

assert(
  invalidTransitionRejected,
  "invalid transitions should throw an error",
);

let hookEvent:
  | WorkflowTransitionEvent<typeof reportWorkflow>
  | undefined;

const hookedInstance = createWorkflowInstance(reportWorkflow, {
  onTransition(event) {
    hookEvent = event;
  },
});

hookedInstance.transition("submitted");

assert(
  hookEvent !== undefined &&
    hookEvent.type === "workflow.transitioned" &&
    hookEvent.workflowId === "report" &&
    hookEvent.workflowVersion === 1 &&
    hookEvent.from === "draft" &&
    hookEvent.to === "submitted",
  "workflow transition hook should receive the successful transition event",
);

assert(
  hookedInstance.state === "submitted",
  "workflow transition hook should not prevent a successful transition",
);

const instance = createWorkflowInstance(reportWorkflow);

assert(instance.state === "draft", "instance should start at the initial state");
assert(
  instance.workflowId === "report" &&
    instance.workflowVersion === 1,
  "instance should retain the workflow definition identity",
);
assert(instance.history.length === 0, "new instance should have empty history");
assert(!instance.isTerminal(), "draft should not be completed");

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
assert(!instance.isTerminal(), "submitted should not be completed");

const firstHistoryEntry = instance.history[0];

assert(
  firstHistoryEntry !== undefined &&
    firstHistoryEntry.from === "draft" &&
    firstHistoryEntry.to === "submitted",
  "history should record the submitted transition",
);

assert(
  instance.transition("under_review") === "under_review",
  "instance should support sequential transitions",
);
assert(instance.state === "under_review", "instance should track the current state");
assert(!instance.isTerminal(), "under_review should not be completed");

const secondHistoryEntry = instance.history[1];

assert(
  secondHistoryEntry !== undefined &&
    secondHistoryEntry.from === "submitted" &&
    secondHistoryEntry.to === "under_review",
  "history should record sequential transitions",
);

let instanceInvalidTransitionRejected = false;

try {
  instance.transition("completed");
} catch (error) {
  instanceInvalidTransitionRejected =
    error instanceof InvalidWorkflowTransitionError &&
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
assert(
  instance.history.length === 2,
  "failed transition should not add a history entry",
);

instance.transition("approved");
instance.transition("completed");

assert(instance.state === "completed", "instance should reach completed");
assert(instance.isTerminal(), "completed should be detected as terminal");
const thirdHistoryEntry = instance.history[2];
const fourthHistoryEntry = instance.history[3];

assert(
  thirdHistoryEntry !== undefined &&
    fourthHistoryEntry !== undefined &&
    thirdHistoryEntry.from === "under_review" &&
    thirdHistoryEntry.to === "approved" &&
    fourthHistoryEntry.from === "approved" &&
    fourthHistoryEntry.to === "completed",
  "history should contain the complete successful transition sequence",
);

const historySnapshot = instance.history;
assert(historySnapshot.length === 4, "history snapshot should contain all entries");

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

  // @ts-expect-error Invalid target state must be rejected by TypeScript.
  transitionWithEvent(reportWorkflow, "draft", "missing");

  const invalidEvent: WorkflowTransitionEvent<typeof reportWorkflow> = {
    type: "workflow.transitioned",
    workflowId: "report",
    workflowVersion: 1,
    // @ts-expect-error Invalid event source state must be rejected by TypeScript.
    from: "missing",
    to: "submitted",
  };

  void invalidEvent;
}

console.log("workflow tests passed");
