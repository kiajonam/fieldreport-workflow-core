import {
  DuplicateWorkflowRegistrationError,
  InvalidWorkflowDefinitionError,
  WorkflowNotFoundError,
  WorkflowRegistry,
} from "./registry.js";
import type { WorkflowDefinition } from "./workflow.js";

type ReportState =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "completed";

const reportWorkflowV1: WorkflowDefinition<ReportState> = {
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

const reportWorkflowV2: WorkflowDefinition<ReportState> = {
  ...reportWorkflowV1,
  version: 2,
};

const orderWorkflowV1: WorkflowDefinition<
  "created" | "assigned" | "completed"
> = {
  id: "order",
  version: 1,
  initialState: "created",
  transitions: {
    created: ["assigned"],
    assigned: ["completed"],
    completed: [],
  },
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const registry = new WorkflowRegistry();

registry.register(reportWorkflowV1);
registry.register(reportWorkflowV2);
registry.register(orderWorkflowV1);

assert(
  registry.has("report", 1) &&
    registry.has("report", 2) &&
    registry.has("order", 1),
  "registry should report registered workflow versions",
);

assert(
  !registry.has("report", 99) &&
    !registry.has("missing", 1),
  "registry should report missing workflow versions",
);

assert(
  JSON.stringify(registry.getVersions("report")) === JSON.stringify([1, 2]),
  "registry should return sorted versions for a workflow",
);

assert(
  registry.getVersions("missing").length === 0,
  "registry should return an empty version list for an unknown workflow",
);

let registryHookContext: Record<string, unknown> | undefined;

const resolvedInstance = registry.createInstance("report", 1, {
  onTransition(event) {
    registryHookContext = event.context;
  },
});

assert(
  resolvedInstance.state === "draft" &&
    resolvedInstance.workflowId === "report" &&
    resolvedInstance.workflowVersion === 1,
  "registry should create an instance from workflow identity and version",
);

resolvedInstance.transition("submitted", {
  actorId: "registry-user",
  source: "api",
});

assert(
  registryHookContext?.actorId === "registry-user" &&
    resolvedInstance.history[0]?.context?.source === "api",
  "registry-created instances should preserve context through hooks and history",
);

const resolvedReportV1 = registry.resolve("report", 1);
const resolvedReportV2 = registry.resolve("report", 2);
const resolvedOrderV1 = registry.resolve("order", 1);

assert(
  resolvedReportV1.id === "report" &&
    resolvedReportV1.version === 1 &&
    resolvedReportV1.initialState === "draft",
  "registry should resolve report workflow version 1",
);

assert(
  resolvedReportV2.id === "report" &&
    resolvedReportV2.version === 2,
  "registry should resolve a different version independently",
);

assert(
  resolvedOrderV1.id === "order" &&
    resolvedOrderV1.version === 1,
  "registry should resolve different workflow identities independently",
);

let duplicateRejected = false;

try {
  registry.register(reportWorkflowV1);
} catch (error) {
  duplicateRejected =
    error instanceof DuplicateWorkflowRegistrationError &&
    error.message === "Workflow is already registered: report v1";
}

assert(
  duplicateRejected,
  "registry should reject duplicate workflow identity and version",
);

let missingWorkflowRejected = false;

try {
  registry.resolve("report", 99);
} catch (error) {
  missingWorkflowRejected =
    error instanceof WorkflowNotFoundError &&
    error.message === "Workflow not found: report v99";
}

assert(
  missingWorkflowRejected,
  "registry should reject unknown workflow versions",
);

let missingIdentityRejected = false;

try {
  registry.resolve("missing", 1);
} catch (error) {
  missingIdentityRejected =
    error instanceof WorkflowNotFoundError &&
    error.message === "Workflow not found: missing v1";
}

assert(
  missingIdentityRejected,
  "registry should reject unknown workflow identities",
);

function typeSafetyChecks(): void {
  const registryWithTypedWorkflow = new WorkflowRegistry();
  registryWithTypedWorkflow.register(reportWorkflowV1);

  const resolved = registryWithTypedWorkflow.resolve("report", 1);

  assert(
    resolved.id === "report" && resolved.version === 1,
    "resolved workflow should expose its identity",
  );
}

console.log("workflow registry tests passed");
