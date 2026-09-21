export type WorkflowDefinition<TState extends string> = {
  initialState: TState;
  transitions: Record<TState, readonly TState[]>;
};

export const reportWorkflow: WorkflowDefinition<
  "draft" | "submitted" | "under_review" | "approved" | "rejected" | "completed"
> = {
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

type WorkflowState<TWorkflow> = TWorkflow extends {
  transitions: infer TTransitions;
}
  ? Extract<keyof TTransitions, string>
  : never;

export function canTransition<TWorkflow extends {
  transitions: object;
}>(
  workflow: TWorkflow,
  from: WorkflowState<TWorkflow>,
  to: WorkflowState<TWorkflow>,
): boolean {
  const transitions = workflow.transitions as Record<
    string,
    readonly string[] | undefined
  >;

  return transitions[from]?.includes(to) ?? false;
}

export function transition<TWorkflow extends {
  transitions: object;
}>(
  workflow: TWorkflow,
  from: WorkflowState<TWorkflow>,
  to: WorkflowState<TWorkflow>,
): WorkflowState<TWorkflow> {
  if (!canTransition(workflow, from, to)) {
    throw new Error(`Invalid workflow transition: ${from} -> ${to}`);
  }

  return to;
}
