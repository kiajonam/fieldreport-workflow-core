import {
  createWorkflowInstance,
  transitionWithEvent,
} from "fieldreport-workflow-core";

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

const first = transitionWithEvent(
  workflow,
  "CREATED",
  "IN_PROGRESS",
  {
    userId: "user-123",
    source: "mobile-app",
  },
);

console.log("State:", first.state);
console.log("Event:", first.event);

const emittedEvents = [];

const instance = createWorkflowInstance(workflow, {
  onTransition(event) {
    emittedEvents.push(event);
  },
});

instance.transition("IN_PROGRESS", {
  userId: "user-123",
  source: "mobile-app",
});

instance.transition("COMPLETED", {
  userId: "user-123",
  source: "mobile-app",
});

console.log("Hook events:", emittedEvents);
