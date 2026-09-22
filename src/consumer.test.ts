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

const initialState: WorkflowState<typeof workflow> = "draft";
const historyEntry: WorkflowHistoryEntry<typeof workflow> = {
  from: "draft",
  to: "submitted",
};

const publicContextHistoryEntry: WorkflowHistoryEntry<
  typeof workflow,
  { readonly actorId: string }
> = {
  from: "draft",
  to: "submitted",
  context: {
    actorId: "user-123",
  },
};

if (initialState !== workflow.initialState) {
  throw new Error("public WorkflowState type should match the workflow state");
}

if (
  historyEntry.from !== "draft" ||
  historyEntry.to !== "submitted" ||
  publicContextHistoryEntry.context?.actorId !== "user-123"
) {
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

if (
  instance.state !== "draft" ||
  instance.workflowId !== "report" ||
  instance.workflowVersion !== 1
) {
  throw new Error("public createWorkflowInstance API should expose the workflow identity");
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
