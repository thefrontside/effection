# Deterministic and Diagnostic Tests Policy (Experimental)

This document defines the experimental policy for writing stable, non-flaky tests with clear failure output.

## Core Principle

**Tests should be stable (no flakes/timeouts) and produce clear failure output.** Tie assertions to lifecycle invariants, not elapsed time.

> **Note:** This policy extends [No-Sleep Test Synchronization](./no-sleep-test-sync.md) with broader guidance on test structure and lifecycle assertions.

## The Rule

| Scenario          | Required Behavior                                                             |
| ----------------- | ----------------------------------------------------------------------------- |
| Waiting for state | Use deterministic helpers (`when()`, `is()`, `withResolvers()`) not `sleep()` |
| Concurrency tests | Assert on lifecycle invariants (cleanup ran, task halted)                     |
| Test structure    | Follow setup → trigger → assertion shape                                      |
| Failure messages  | Include expected vs actual with context                                       |
| Async operations  | Use structured concurrency patterns in tests too                              |

## Examples

### Compliant: Lifecycle invariant assertion

```typescript
import { describe, it, expect } from "@effectionx/vitest";
import { spawn, suspend, resource } from "effection";

it("runs cleanup on halt", function* () {
  let cleaned = false;

  let op = resource(function* (provide) {
    try {
      yield* provide("ok");
      yield* suspend();
    } finally {
      cleaned = true;
    }
  });

  let task = yield* spawn(op);
  yield* task.halt();

  expect(cleaned).toBe(true);
});
```

### Compliant: Using withResolvers for callback synchronization

```typescript
import { describe, it, expect } from "@effectionx/vitest";
import { spawn, withResolvers } from "effection";

it("notifies on connection", function* () {
  let { resolve, operation } = withResolvers<string>();

  yield* spawn(function* () {
    // simulate async callback
    resolve("connected");
  });

  let result = yield* operation;
  expect(result).toBe("connected");
});
```

### Non-Compliant: Time-based wait (flaky)

```typescript
it("probably cleaned up", function* () {
  let cleaned = false;

  yield* spawn(function* () {
    try {
      yield* suspend();
    } finally {
      cleaned = true;
    }
  });

  yield* sleep(50); // BAD: timing oracle, flaky
  expect(cleaned).toBe(true);
});
```

### Non-Compliant: Weak assertion without lifecycle check

```typescript
it("task started", function* () {
  let task = yield* spawn(doWork());
  // BAD: no assertion about task state, cleanup, or result
  expect(task).toBeDefined(); // too weak
});
```

## Verification Checklist

Before marking a review complete, verify:

- [ ] No `sleep(ms)` where `ms > 0` used to wait for async results
- [ ] Assertions check lifecycle invariants (cleanup, halt, completion)
- [ ] Tests follow setup → trigger → assertion structure
- [ ] Failure messages include expected vs actual values
- [ ] See also: [No-Sleep Test Synchronization](./no-sleep-test-sync.md)

## Common Mistakes

| Mistake                          | Fix                                                  |
| -------------------------------- | ---------------------------------------------------- |
| `sleep(100)` to wait for result  | Use `withResolvers()`, `when()`, or `is()`           |
| Asserting only on truthy/defined | Assert on specific values and states                 |
| No cleanup verification          | Record cleanup in a `finally`/`ensure()` and assert it ran |
| Missing halt path test           | Test both success and halt scenarios                 |

## Related Policies

- [No-Sleep Test Synchronization](./no-sleep-test-sync.md) - Specific patterns for avoiding sleep in tests
- [Structured Concurrency](./structured-concurrency.md) - Lifecycle ownership patterns
- [Correctness Through Explicit Invariants](./correctness-invariants.md) - Testing edge cases
- [Policies Index](./index.md) - Add your new policy to the Policy Documents table
