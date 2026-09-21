export type {
  WorkflowDefinition,
  WorkflowInstance,
} from "./workflow.js";

export {
  canTransition,
  createWorkflowInstance,
  getAvailableTransitions,
  transition,
} from "./workflow.js";
