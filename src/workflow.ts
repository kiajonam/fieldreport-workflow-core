export type WorkflowDefinition<TState extends string> = {
  readonly version: number;
  initialState: TState;
  transitions: Record<TState, readonly TState[]>;
};

export class InvalidWorkflowTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid workflow transition: ${from} -> ${to}`);
    this.name = "InvalidWorkflowTransitionError";
  }
}

export type WorkflowState<TWorkflow> = TWorkflow extends {
  transitions: infer TTransitions;
}
  ? Extract<keyof TTransitions, string>
  : never;

export type WorkflowHistoryEntry<TWorkflow extends {
  version: number;
  transitions: object;
}> = {
  readonly from: WorkflowState<TWorkflow>;
  readonly to: WorkflowState<TWorkflow>;
};

export type WorkflowTransitionEvent<TWorkflow extends {
  version: number;
  transitions: object;
}> = {
  readonly type: "workflow.transitioned";
  readonly workflowVersion: TWorkflow["version"];
  readonly from: WorkflowState<TWorkflow>;
  readonly to: WorkflowState<TWorkflow>;
};

export function createWorkflowTransitionEvent<TWorkflow extends {
  version: number;
  transitions: object;
}>(
  workflow: TWorkflow,
  from: WorkflowState<TWorkflow>,
  to: WorkflowState<TWorkflow>,
): WorkflowTransitionEvent<TWorkflow> {
  return {
    type: "workflow.transitioned",
    workflowVersion: workflow.version,
    from,
    to,
  };
}

export type WorkflowTransitionWithEventResult<TWorkflow extends {
  version: number;
  transitions: object;
}> = {
  readonly state: WorkflowState<TWorkflow>;
  readonly event: WorkflowTransitionEvent<TWorkflow>;
};

export function transitionWithEvent<TWorkflow extends {
  version: number;
  transitions: object;
}>(
  workflow: TWorkflow,
  from: WorkflowState<TWorkflow>,
  to: WorkflowState<TWorkflow>,
): WorkflowTransitionWithEventResult<TWorkflow> {
  const state = transition(workflow, from, to);

  return {
    state,
    event: createWorkflowTransitionEvent(workflow, from, state),
  };
}

export type WorkflowInstance<TWorkflow extends {
  version: number;
  transitions: object;
}> = {
  readonly state: WorkflowState<TWorkflow>;
  readonly workflowVersion: TWorkflow["version"];
  readonly history: readonly WorkflowHistoryEntry<TWorkflow>[];
  getAvailableTransitions(): readonly WorkflowState<TWorkflow>[];
  canTransition(to: WorkflowState<TWorkflow>): boolean;
  transition(to: WorkflowState<TWorkflow>): WorkflowState<TWorkflow>;
  isTerminal(): boolean;
};

export function getAvailableTransitions<TWorkflow extends {
  version: number;
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
  version: number;
  transitions: object;
}>(
  workflow: TWorkflow,
  from: WorkflowState<TWorkflow>,
  to: WorkflowState<TWorkflow>,
): boolean {
  return getAvailableTransitions(workflow, from).includes(to);
}

export function transition<TWorkflow extends {
  version: number;
  transitions: object;
}>(
  workflow: TWorkflow,
  from: WorkflowState<TWorkflow>,
  to: WorkflowState<TWorkflow>,
): WorkflowState<TWorkflow> {
  if (!canTransition(workflow, from, to)) {
    throw new InvalidWorkflowTransitionError(from, to);
  }

  return to;
}

export function createWorkflowInstance<TWorkflow extends {
  version: number;
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

    get workflowVersion() {
      return workflow.version;
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
