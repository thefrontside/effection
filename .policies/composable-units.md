# Small, Composable Units Policy (Experimental)

This document defines the experimental policy for extracting focused helpers and modules with single responsibilities.

## Core Principle

**Extract concepts into focused helpers/modules so each piece has one reason to change.** Small operations compose cleanly.

> **Note:** For the canonical `resource()` pattern with teardown, see [Structured Concurrency](./structured-concurrency.md).

## The Rule

| Scenario          | Required Behavior                         |
| ----------------- | ----------------------------------------- |
| Mixed concerns    | Extract into separate named helpers       |
| Setup/teardown    | Use `resource()` to encapsulate lifecycle |
| Pure transforms   | Extract into standalone functions         |
| Repeated patterns | Create reusable operation helpers         |
| Large functions   | Split into steps with clear names         |

## Examples

### Compliant: Separated concerns

```typescript
import { call, type Operation } from "effection";
import { readFile } from "node:fs/promises";

// Pure transform - no I/O
function parseConfig(text: string): Config {
  return JSON.parse(text);
}

// I/O operation - single responsibility
function* readText(path: string): Operation<string> {
  return yield* call(() => readFile(path, "utf8"));
}

// Composed operation - clear steps
function* readConfig(path: string): Operation<Config> {
  let text = yield* readText(path);
  return parseConfig(text);
}
```

### Compliant: Resource for setup/teardown

```typescript
import { ensure, resource, type Operation } from "effection";

// Lifecycle encapsulated in resource
function useDatabase(url: string): Operation<Database> {
  return resource(function* (provide) {
    let db = yield* connect(url);

    yield* ensure(function* () {
      yield* db.close();
    });

    yield* provide(db);
  });
}

// Usage is simple
function* main(): Operation<void> {
  let db = yield* useDatabase(DB_URL);
  yield* db.query("SELECT 1");
}
```

### Non-Compliant: Mixed concerns in one function

```typescript
function* readConfig(path: string): Operation<Config> {
  // BAD: parsing + retries + logging + fallback + formatting all inline
  let text: string;
  for (let i = 0; i < 3; i++) {
    try {
      console.log(`Attempt ${i + 1}...`);
      text = yield* call(() => readFile(path, "utf8"));
      break;
    } catch (e) {
      if (i === 2) {
        console.log("Using fallback config");
        return DEFAULT_CONFIG;
      }
      yield* sleep(100 * (i + 1));
    }
  }
  try {
    return JSON.parse(text!);
  } catch {
    console.log("Parse failed, using fallback");
    return DEFAULT_CONFIG;
  }
}
```

### Non-Compliant: Inline teardown logic

```typescript
function* main(): Operation<void> {
  let db = yield* connect(DB_URL);
  try {
    yield* doWork(db);
    // More work...
    yield* moreWork(db);
  } finally {
    // BAD: teardown mixed with business logic
    yield* db.close();
  }
}

// GOOD: Extract to resource
function* main(): Operation<void> {
  let db = yield* useDatabase(DB_URL);
  yield* doWork(db);
  yield* moreWork(db);
}
```

## Verification Checklist

Before marking a review complete, verify:

- [ ] Functions have single responsibility
- [ ] Setup/teardown is encapsulated in `resource()`
- [ ] Pure transforms are separate from I/O operations
- [ ] Long functions are split into named steps
- [ ] Repeated patterns are extracted to helpers

## Common Mistakes

| Mistake                          | Fix                                        |
| -------------------------------- | ------------------------------------------ |
| Parse + fetch in one function    | Split: `fetchData()` + `parseData()`       |
| Inline try/finally for cleanup   | Use `resource()` with `ensure()` teardown  |
| "God operation" doing everything | Extract into composable steps              |
| Copy-pasted operation logic      | Create reusable helper                     |

## Related Policies

- [Structured Concurrency](./structured-concurrency.md) - Resource lifecycle patterns
- [Async Teardown](./async-teardown.md) - Cleanup that yields belongs in `ensure()`
- [Naming Consistency](./naming-consistency.md) - Clear names for extracted helpers
- [Policies Index](./index.md) - Add your new policy to the Policy Documents table
