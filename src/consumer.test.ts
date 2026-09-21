import {
  canTransition,
  createWorkflowInstance,
  getAvailableTransitions,
  transition,
  type WorkflowDefinition,
  type WorkflowHistoryEntry,
  type WorkflowState,
} from "fieldreport-workflow-core";

type ReportState =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "completed";

const workflow: WorkflowDefinition<ReportState> = {
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

const initialState: WorkflowState<typeof workflow> = "draft";
const historyEntry: WorkflowHistoryEntry<typeof workflow> = {
  from: "draft",
  to: "submitted",
};

if (initialState !== workflow.initialState) {
  throw new Error("public WorkflowState type should match the workflow state");
}

if (historyEntry.from !== "draft" || historyEntry.to !== "submitted") {
  throw new Error("public WorkflowHistoryEntry type should be usable");
}

if (!canTransition(workflow, "draft", "submitted")) {
  throw new Error("public canTransition API should work");
}

if (getAvailableTransitions(workflow, "draft")[0] !== "submitted") {
  throw new Error("public getAvailableTransitions API should work");
}

if (transition(workflow, "draft", "submitted") !== "submitted") {
  throw new Error("public transition API should work");
}

const instance = createWorkflowInstance(workflow);

if (instance.state !== "draft") {
  throw new Error("public createWorkflowInstance API should work");
}

instance.transition("submitted");

if (instance.history.length !== 1) {
  throw new Error("public workflow instance history should work");
}

function typeSafetyChecks(): void {
  // @ts-expect-error Invalid workflow state must remain rejected through the public API.
  instance.transition("missing");
}

console.log("public API consumer test passed");
