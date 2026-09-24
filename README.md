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
- Stateful workflow instances
- Transition history and contextual audit semantics
- Transition events and hooks
- Typed workflow errors
- Works with modern TypeScript and Node.js
- Generates TypeScript declaration files for consumers

## Installation

The package is publicly available on npm as version `0.1.0`:

```bash
npm install fieldreport-workflow-core
```

For local development directly from the repository:

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

type OrderState =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "completed";

const workflow: WorkflowDefinition<OrderState> = {
  id: "order",
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

## Stateful instances and contextual history

A workflow instance keeps its current state and records every successful transition. Optional transition context is preserved in the history and can carry application-defined audit information.

```ts
import { createWorkflowInstance } from "fieldreport-workflow-core";

const instance = createWorkflowInstance(workflow);

instance.transition("submitted", {
  userId: "user-123",
  reason: "Order submitted",
  source: "web-app",
});

console.log(instance.state);
// "submitted"

console.log(instance.history);
// [
//   {
//     from: "draft",
//     to: "submitted",
//     context: {
//       userId: "user-123",
//       reason: "Order submitted",
//       source: "web-app"
//     }
//   }
// ]
```

The context shape is application-defined. The core does not interpret or persist these fields.

A runnable JavaScript consumer example is available at:

`examples/consumer-context/index.js`

## Workflow registry

The registry keeps workflow definitions addressable by their stable identity and version:

```ts
import { WorkflowRegistry } from "fieldreport-workflow-core";

const registry = new WorkflowRegistry();

registry.register(workflow);

registry.has("order", 1);
// true

registry.getVersions("order");
// [1]

const resolved = registry.resolve("order", 1);
// returns the registered workflow definition

registry.resolve("order", 99);
// throws WorkflowNotFoundError
```

Registering the same workflow identity and version twice throws
`DuplicateWorkflowRegistrationError`.

## Transition hooks

Workflow instances can optionally receive an `onTransition` hook:

```ts
import {
  createWorkflowInstance,
  type WorkflowDefinition,
} from "fieldreport-workflow-core";

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

### Audit semantics

A workflow instance history records each successful transition as `from`, `to`,
and, when provided, the transition context. The same context is delivered to the
transition hook and event.

The workflow state and history are committed before the hook executes. A hook
failure does not erase the committed audit entry or roll back the workflow state.

## Development

```bash
npm run typecheck
npm test
npm run build
```

The package build writes JavaScript and declaration files to `dist/`.

## Scope

The core deliberately does not contain persistence, HTTP, database, authentication, authorization, UI, or application-specific business logic. Those concerns belong to the application using the workflow engine.

## License

MIT
