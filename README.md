# fieldreport-workflow-core

A lightweight, type-safe workflow state machine for TypeScript applications.

## Why

Many applications contain workflows such as:

```text
draft -> submitted -> under_review -> approved -> completed
                         |
                         └------------> rejected -> draft
```

This package provides a small core for defining allowed states and checking whether a transition is valid.

## Features

- Type-safe workflow states
- Explicit transition maps
- No runtime dependencies
- Small API surface
- Workflow identity and versioning
- In-memory workflow registry and version resolution
- Works with modern TypeScript and Node.js
- Generates TypeScript declaration files for consumers

## Installation

This project is currently under development and is not published to npm yet.

For local development:

```bash
git clone https://github.com/kiajonam/fieldreport-workflow-core.git
cd fieldreport-workflow-core
npm install
npm run typecheck
npm test
```

## Usage

```ts
import { canTransition, type WorkflowDefinition } from "fieldreport-workflow-core";

type ReportState =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "completed";

const workflow: WorkflowDefinition<ReportState> = {
  id: "report",
  version: 1,
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

canTransition(workflow, "draft", "submitted");
// true

canTransition(workflow, "draft", "completed");
// false
```

Invalid states are rejected by TypeScript:

```ts
canTransition(workflow, "draft", "unknown");
// TypeScript error
```



## Workflow registry

The registry keeps workflow definitions addressable by their stable identity and version:

```ts
import { WorkflowRegistry } from "fieldreport-workflow-core";

const registry = new WorkflowRegistry();

registry.register(workflow);

registry.has("report", 1);
// true

registry.getVersions("report");
// [1]

const resolved = registry.resolve("report", 1);
// returns the registered workflow definition

registry.resolve("report", 99);
// throws WorkflowNotFoundError
```

Registering the same workflow identity and version twice throws
`DuplicateWorkflowRegistrationError`.


## Transition hooks

Workflow instances can optionally receive an `onTransition` hook:

```ts
const instance = createWorkflowInstance(workflow, {
  onTransition(event) {
    // publish an event, record an audit entry, update metrics, etc.
  },
});
```

The transition is committed to the instance state and history before the hook runs.
If the hook throws, the transition is **not rolled back**. The error is wrapped in
`WorkflowTransitionHookError`, and the committed state remains available on the instance.

This keeps external side effects from controlling the workflow state machine.

## Development

```bash
npm run typecheck
npm test
npm run build
```

The package build writes JavaScript and declaration files to `dist/`.

## Scope

The core deliberately does not contain persistence, HTTP, database, authentication, authorization, UI, or FieldReport business logic. Those concerns belong to the application using the workflow engine.

## License

MIT
