# Structured Concurrency Policy (Experimental)

This document defines the experimental policy for structured concurrency patterns that make task lifetimes explicit and deterministic.

## Core Principle

**Concurrency must be structured: cancellation, cleanup, and task lifetimes should be obvious and enforced.** No fire-and-forget async work.

## The Rule

| Scenario                    | Required Behavior                                                             |
| --------------------------- | ----------------------------------------------------------------------------- |
| Starting async work         | Must be owned by a scope via `resource()`, `spawn()` (yielded), or `scoped()` |
| Consuming Promises          | Use `until(promise)` to integrate with scope lifecycle                        |
| Cancellation-sensitive APIs | Use `useAbortSignal()` and pass to fetch/timers                               |
| Background tasks            | Must be spawned children, not detached                                        |
| Synchronous cleanup         | Must be in a `finally` block or resource teardown                             |
| Cleanup that needs `yield*` | Must be in `ensure()` — see [Async Teardown](./async-teardown.md)             |

## Examples

### Compliant: Structured polling with abort signal

```typescript
import { spawn, sleep, useAbortSignal, until, type Operation } from "effection";

function* poll(endpoint: string): Operation<void> {
  let signal = yield* useAbortSignal();
  while (true) {
    yield* until(fetch(endpoint, { signal }));
    yield* sleep(1000);
  }
}

function* main(): Operation<void> {
  let task = yield* spawn(poll("/health")); // child owned by current scope
  yield* sleep(5000);
  yield* task.halt(); // observed shutdown
}
```

### Compliant: Resource with proper teardown

```typescript
import { resource, until, type Operation } from "effection";

interface Connection {
  send(msg: string): Operation<void>;
}

function useConnection(url: string): Operation<Connection> {
  return resource(function* (provide) {
    let ws = new WebSocket(url);
    try {
      yield* until(new Promise((resolve) => (ws.onopen = resolve)));
      yield* provide({
        *send(msg: string) {
          ws.send(msg);
        },
      });
    } finally {
      ws.close(); // cleanup always runs
    }
  });
}
```

`ws.close()` is synchronous, so a `finally` block is fine here. Teardown that needs
`yield*` must use `ensure()` instead — a `yield*` inside `finally` disarms halt
propagation for that frame. See [Async Teardown](./async-teardown.md).

### Non-Compliant: Fire-and-forget spawn

```typescript
function* main(): Operation<void> {
  spawn(poll("/health")); // BAD: created but never yielded, not a structured child
  // scope exits without waiting for or halting the poll
}
```

### Non-Compliant: Unowned Promise

```typescript
function* main(): Operation<void> {
  void fetch("/health"); // BAD: eager promise, unowned by Effection scope
  // no way to cancel, no cleanup on scope exit
}
```

## Verification Checklist

Before marking a review complete, verify:

- [ ] All `spawn()` calls are yielded (`yield* spawn(...)`)
- [ ] Promises are wrapped with `until()` for scope integration
- [ ] Fetch calls use `useAbortSignal()` for cancellation
- [ ] Resources have teardown — `finally` for sync cleanup, `ensure()` when it yields
- [ ] No `finally` block in the diff contains `yield*`
- [ ] No fire-and-forget `void asyncFn()` patterns

## Common Mistakes

| Mistake                         | Fix                                              |
| ------------------------------- | ------------------------------------------------ |
| `spawn(op)` without yield       | `yield* spawn(op)` to attach to scope            |
| `await fetch(url)` in operation | `yield* until(fetch(url, { signal }))`           |
| `setTimeout` without cleanup    | Use `sleep()` or wrap with `useAbortSignal()`    |
| Sync cleanup in `try` block     | Move to `finally` block for halt safety          |
| `yield*` inside a `finally`     | Move it into `ensure()` — the halt is lost       |

## Related Policies

- [No-Sleep Test Synchronization](./no-sleep-test-sync.md) - Deterministic test patterns for structured concurrency
- [Async Teardown](./async-teardown.md) - Cleanup that yields belongs in `ensure()`
- [Stateless Stream Operations](./stateless-streams.md) - Deferred execution pattern
- [Policies Index](./index.md) - Add your new policy to the Policy Documents table
