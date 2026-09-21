export type WorkflowDefinition<TState extends string> = {
  initialState: TState;
  transitions: Record<TState, readonly TState[]>;
};

export type WorkflowState<TWorkflow> = TWorkflow extends {
  transitions: infer TTransitions;
}
  ? Extract<keyof TTransitions, string>
  : never;

export type WorkflowHistoryEntry<TWorkflow extends { transitions: object }> = {
  readonly from: WorkflowState<TWorkflow>;
  readonly to: WorkflowState<TWorkflow>;
};

export type WorkflowInstance<TWorkflow extends { transitions: object }> = {
  readonly state: WorkflowState<TWorkflow>;
  readonly history: readonly WorkflowHistoryEntry<TWorkflow>[];
  getAvailableTransitions(): readonly WorkflowState<TWorkflow>[];
  canTransition(to: WorkflowState<TWorkflow>): boolean;
  transition(to: WorkflowState<TWorkflow>): WorkflowState<TWorkflow>;
  isTerminal(): boolean;
};

export function getAvailableTransitions<TWorkflow extends {
  transitions: object;
}>(
  workflow: TWorkflow,
  state: WorkflowState<TWorkflow>,
): readonly WorkflowState<TWorkflow>[] {
  const transitions = workflow.transitions as Record<
    string,
    readonly string[] | undefined
  >;

  return (transitions[state] ?? []) as readonly WorkflowState<TWorkflow>[];
}

export function canTransition<TWorkflow extends {
  transitions: object;
}>(
  workflow: TWorkflow,
  from: WorkflowState<TWorkflow>,
  to: WorkflowState<TWorkflow>,
): boolean {
  return getAvailableTransitions(workflow, from).includes(to);
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

export function createWorkflowInstance<TWorkflow extends {
  initialState: WorkflowState<TWorkflow>;
  transitions: object;
}>(
  workflow: TWorkflow,
): WorkflowInstance<TWorkflow> {
  let state = workflow.initialState;
  const history: WorkflowHistoryEntry<TWorkflow>[] = [];

  return {
    get state() {
      return state;
    },

    get history() {
      return history.slice();
    },

    getAvailableTransitions() {
      return getAvailableTransitions(workflow, state);
    },

    canTransition(to) {
      return canTransition(workflow, state, to);
    },

    transition(to) {
      const from = state;
      const nextState = transition(workflow, from, to);

      history.push({ from, to: nextState });
      state = nextState;

      return state;
    },

    isTerminal() {
      return getAvailableTransitions(workflow, state).length === 0;
    },
  };
}
