export type {
  WorkflowDefinition,
  WorkflowHistoryEntry,
  WorkflowInstance,
  WorkflowState,
} from "./workflow.js";

export {
  canTransition,
  createWorkflowInstance,
  getAvailableTransitions,
  transition,
} from "./workflow.js";
