import type { WorkflowDefinition } from "./workflow.js";

type RegisteredWorkflowDefinition = {
  readonly id: string;
  readonly version: number;
  readonly initialState: string;
  readonly transitions: Record<string, readonly string[]>;
};

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

export class WorkflowRegistry {
  private readonly workflows = new Map<
    string,
    Map<number, RegisteredWorkflowDefinition>
  >();

  register<TState extends string>(
    workflow: WorkflowDefinition<TState>,
  ): void {
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

    versions.set(
      workflow.version,
      workflow as unknown as RegisteredWorkflowDefinition,
    );
  }

  resolve(
    workflowId: string,
    version: number,
  ): RegisteredWorkflowDefinition {
    const versions = this.workflows.get(workflowId);
    const workflow = versions?.get(version);

    if (workflow === undefined) {
      throw new WorkflowNotFoundError(workflowId, version);
    }

    return workflow;
  }
}
