import { createWorkflowInstance } from "fieldreport-workflow-core";

const workflow = {
  id: "demo-order",
  version: 1,
  initialState: "CREATED",
  transitions: {
    CREATED: ["IN_PROGRESS"],
    IN_PROGRESS: ["COMPLETED"],
    COMPLETED: [],
  },
};

const instance = createWorkflowInstance(workflow);

instance.transition("IN_PROGRESS", {
  userId: "user-123",
  reason: "Work started",
  source: "mobile-app",
});

instance.transition("COMPLETED", {
  userId: "user-123",
  reason: "Work completed",
  source: "mobile-app",
});

console.log("State:", instance.state);
console.log("History:", instance.history);
