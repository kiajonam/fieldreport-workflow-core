export type WorkflowDefinition<Tstate extends string> = {
    initialState: Tstate;
    transitions: Record<Tstate, readonly Tstate[]>;
};

export const reportWorkflow: WorkflowDefinition<"draft" | "submitted" | "under_review" | "approved" | "rejected" | "completed" > = {
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
export function canTransition<TState extends string>(
  workflow: WorkflowDefinition<TState>,
  from: TState,
  to: TState,
): boolean {
  return workflow.transitions[from].includes(to);
}