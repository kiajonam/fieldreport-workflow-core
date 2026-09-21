import { canTransition, reportWorkflow } from "./workflow.js";

console.log(
  canTransition(reportWorkflow, "draft", "submitted"),
);

console.log(
  canTransition(reportWorkflow, "draft", "completed"),
);
