import { canTransition,reportWorkflow } from "./workflow.js";

console.log(
    canTransition(reportWorkflow, "darft", "submitted"),
);

console.log(
    canTransition(reportWorkflow, "draf", "completed")
);