import {
  WorkflowRegistry,
  DuplicateWorkflowRegistrationError,
  WorkflowNotFoundError,
} from "fieldreport-workflow-core";

const orderWorkflowV1 = {
  id: "demo-order",
  version: 1,
  initialState: "CREATED",
  transitions: {
    CREATED: ["IN_PROGRESS"],
    IN_PROGRESS: ["COMPLETED"],
    COMPLETED: [],
  },
};

const orderWorkflowV2 = {
  id: "demo-order",
  version: 2,
  initialState: "CREATED",
  transitions: {
    CREATED: ["ASSIGNED"],
    ASSIGNED: ["IN_PROGRESS"],
    IN_PROGRESS: ["COMPLETED"],
    COMPLETED: [],
  },
};

const registry = new WorkflowRegistry();

registry.register(orderWorkflowV1);
registry.register(orderWorkflowV2);

console.log("Has v1:", registry.has("demo-order", 1));
console.log("Has v2:", registry.has("demo-order", 2));
console.log("Versions:", registry.getVersions("demo-order"));

const resolvedV1 = registry.resolve("demo-order", 1);
const resolvedV2 = registry.resolve("demo-order", 2);

console.log("Resolved v1:", resolvedV1.version);
console.log("Resolved v2:", resolvedV2.version);

const v1Instance = registry.createInstance("demo-order", 1);
v1Instance.transition("IN_PROGRESS");

console.log("v1 instance:", v1Instance.state);

const v2Instance = registry.createInstance("demo-order", 2);
v2Instance.transition("ASSIGNED");
v2Instance.transition("IN_PROGRESS");

console.log("v2 instance:", v2Instance.state);

try {
  registry.register(orderWorkflowV1);
} catch (error) {
  console.log(
    "Duplicate registration:",
    error instanceof DuplicateWorkflowRegistrationError,
    error.message,
  );
}

try {
  registry.resolve("demo-order", 99);
} catch (error) {
  console.log(
    "Missing version:",
    error instanceof WorkflowNotFoundError,
    error.message,
  );
}
