import type {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowState,
} from "./workflow.js";
import { createWorkflowInstance } from "./workflow.js";

type RegisteredWorkflowDefinition = {
  readonly id: string;
  readonly version: number;
  readonly initialState: string;
  readonly transitions: Record<string, readonly string[]>;
};

export class InvalidWorkflowDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidWorkflowDefinitionError";
  }
}

export class DuplicateWorkflowRegistrationError extends Error {
  constructor(workflowId: string, version: number) {
    super(
      `Workflow is already registered: ${workflowId} v${version}`,
    );
    this.name = "DuplicateWorkflowRegistrationError";
  }
}

export class WorkflowNotFoundError extends Error {
  constructor(workflowId: string, version: number) {
    super(
      `Workflow not found: ${workflowId} v${version}`,
    );
    this.name = "WorkflowNotFoundError";
  }
}

function validateWorkflowDefinition<TState extends string>(
  workflow: WorkflowDefinition<TState>,
): void {
  if (workflow.id.trim().length === 0) {
    throw new InvalidWorkflowDefinitionError(
      "Workflow id must not be empty",
    );
  }

  if (!Number.isInteger(workflow.version) || workflow.version < 1) {
    throw new InvalidWorkflowDefinitionError(
      `Workflow version must be a positive integer: ${workflow.version}`,
    );
  }

  if (!(workflow.initialState in workflow.transitions)) {
    throw new InvalidWorkflowDefinitionError(
      `Workflow initial state is not defined: ${workflow.initialState}`,
    );
  }

  const states = new Set(Object.keys(workflow.transitions));

  for (const state of Object.keys(workflow.transitions) as TState[]) {
    const targets: readonly TState[] = workflow.transitions[state];

    for (const target of targets) {
      if (!states.has(target)) {
        throw new InvalidWorkflowDefinitionError(
          `Workflow transition target is not defined: ${state} -> ${target}`,
        );
      }
    }
  }
}

type WorkflowWithTypedStates<TState extends string> =
  WorkflowDefinition<TState>;

export class WorkflowRegistry<
  TWorkflow extends WorkflowWithTypedStates<string> =
    WorkflowWithTypedStates<string>,
> {
  private readonly workflows = new Map<
    string,
    Map<number, TWorkflow>
  >();

  register(workflow: TWorkflow): void {
    validateWorkflowDefinition(
      workflow as WorkflowDefinition<string>,
    );

    let versions = this.workflows.get(workflow.id);

    if (versions === undefined) {
      versions = new Map();
      this.workflows.set(workflow.id, versions);
    }

    if (versions.has(workflow.version)) {
      throw new DuplicateWorkflowRegistrationError(
        workflow.id,
        workflow.version,
      );
    }

    versions.set(workflow.version, workflow);
  }

  has(workflowId: string, version: number): boolean {
    return this.workflows.get(workflowId)?.has(version) ?? false;
  }

  getVersions(workflowId: string): readonly number[] {
    return [...(this.workflows.get(workflowId)?.keys() ?? [])].sort(
      (a, b) => a - b,
    );
  }

  resolve(
    workflowId: string,
    version: number,
  ): TWorkflow {
    const versions = this.workflows.get(workflowId);
    const workflow = versions?.get(version);

    if (workflow === undefined) {
      throw new WorkflowNotFoundError(workflowId, version);
    }

    return workflow;
  }

  createInstance(
    workflowId: string,
    version: number,
  ): WorkflowInstance<TWorkflow> {
    const workflow = this.resolve(workflowId, version);

    return createWorkflowInstance(
      workflow as TWorkflow & {
        initialState: WorkflowState<TWorkflow>;
        transitions: Record<
          WorkflowState<TWorkflow>,
          readonly WorkflowState<TWorkflow>[]
        >;
      },
    );
  }
}
