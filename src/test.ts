import { canTransition, type WorkflowDefinition } from "./workflow.js";

const reportWorkflow: WorkflowDefinition<
  "draft" | "submitted" | "under_review" | "approved" | "rejected" | "completed" 
> = {
  initialState: "draft",
  version: 1,
  transitions: {
    draft: ["submitted"],
    submitted: ["under_review"],
    under_review: ["approved", "rejected"],
    approved: ["completed"],
    rejected: ["draft"],
    completed: [],
  },
};

console.log(
  canTransition(reportWorkflow, "draft", "submitted"),
);

console.log(
  canTransition(reportWorkflow, "draft", "completed"),
);
