# Async Teardown Policy (Recommended)

This document defines the recommended policy for cleanup code that needs to perform asynchronous work.

## Core Principle

**Teardown that needs `yield*` must go in `ensure()`, never in a `finally` block.**

## The Rule

| Case / Condition                                       | Required behavior                          |
| ------------------------------------------------------ | ------------------------------------------- |
| Cleanup is synchronous (`socket.close()`, `off(...)`)  | `finally` is fine; `ensure()` also fine     |
| Cleanup needs `yield*` (awaiting close, draining, disposing) | Must use `ensure()`                   |
| Mixed sync + async cleanup                             | Put the whole thing in `ensure()`           |

### Why

When a task is halted, Effection unwinds it by calling `iterator.return()` on the
coroutine's generator. If a `finally` block then yields, the generator suspends *inside*
the finally and reports `{ done: false }`. Effection resumes it with `iterator.next()` —
**and that takes the frame out of return-mode.** The frame is no longer unwinding, so once
the cleanup finishes, execution carries on past the operation that was being halted.

This is the same defect Effection fixed inside `scoped()` in
[thefrontside/effection#1185](https://github.com/thefrontside/effection/issues/1185):

> `iter.return()` yielded the `destroy()` effects in scoped's finally, but the resume came
> back as `iter.next()` — which takes the frame out of return-mode.

`scoped()` re-arms the unwind explicitly. Ordinary user code has no way to do that, so the
halt is simply lost.

`ensure()` is not affected. It is implemented as a `resource()`, so its `finally` runs in
its own task frame with no code after it, and it is driven by scope destruction — which
`createTask` wraps in `critical()`, making it non-interruptible.

Observed on effection 4.1.0, logging what runs after `task.halt()`:

| Shape                                             | Result                              |
| ------------------------------------------------- | ------------------------------------ |
| `try/finally` + `yield*`, in a delegated helper   | `["cleanup", "outer-after"]` ← leaked |
| `try/finally` + `yield*`, inside `call()`         | `["cleanup", "outer-after"]` ← leaked |
| `try/finally` + `yield*`, inside `scoped()`       | `["cleanup", "outer-after"]` ← leaked |
| `ensure()` + `yield*`                             | `["cleanup"]` ← correct               |

## Examples

### Compliant: Resource with async teardown

```typescript
function useConnection(url: string): Operation<Connection> {
  return resource(function* (provide) {
    let conn = yield* connect(url);

    yield* ensure(function* () {
      yield* conn.close();
    });

    yield* provide(conn);
  });
}
```

### Compliant: Sync teardown may stay in `finally`

```typescript
function useSocket(url: string): Operation<WebSocket> {
  return resource(function* (provide) {
    let socket = new WebSocket(url);
    try {
      yield* provide(socket);
    } finally {
      socket.close(); // no `yield*` — the frame never leaves return-mode
    }
  });
}
```

### Non-Compliant: `yield*` inside `finally`

```typescript
function useConnection(url: string): Operation<Connection> {
  return resource(function* (provide) {
    let conn = yield* connect(url);
    try {
      yield* provide(conn);
    } finally {
      yield* conn.close(); // VIOLATION: disarms halt propagation for this frame
    }
  });
}
```

## Gotchas

These two are not obvious and are the usual source of a broken migration.

### `ensure()` inside `call()` registers on the wrong scope

`ensure()` registers a destructor on the **current** scope. `call()` does not create one —
it delegates to the target's iterator in the same coroutine frame. So an `ensure()` inside
`call(function* () { ... })` attaches to the *enclosing task's* scope and fires far too
late.

Use `scoped()` instead, which does establish a scope boundary:

```typescript
// WRONG — cleanup runs when the caller's task ends, not when this operation does
call(function* () {
  yield* ensure(cleanup);
  return yield* work();
});

// RIGHT
scoped(function* () {
  yield* ensure(cleanup);
  return yield* work();
});
```

`resource(function* (provide) { ... })` bodies and `spawn(function* () { ... })` bodies
each get their own scope, so `ensure()` is correct in those as-is.

### Destructors run in reverse registration order

Register the `ensure()` **exactly where the `try {` was** — after any `spawn()` calls the
cleanup depends on, before the code the `try` wrapped. Registering last means running
first, which preserves the ordering a `finally` gave you: cleanup runs while spawned
children are still alive.

## Verification Checklist

Before marking a review complete, verify:

- [ ] No `finally` block in the diff contains `yield*`
- [ ] Async teardown is registered with `ensure()` before the code it guards
- [ ] `ensure()` is not used directly inside `call()` — `scoped()` is used instead
- [ ] `ensure()` is placed where the `try {` would have been, relative to `spawn()` calls
- [ ] Halt behavior is tested, not just the happy path (see [Correctness Through Explicit Invariants](./correctness-invariants.md))

## Common Mistakes

| Mistake                                       | Fix                                                     |
| --------------------------------------------- | -------------------------------------------------------- |
| `finally { yield* thing.close(); }`           | `yield* ensure(function* () { yield* thing.close(); });` |
| `ensure()` inside `call()`                    | Use `scoped()` — `call()` establishes no scope           |
| `ensure()` registered before the `spawn()` its cleanup depends on | Register it where the `try {` was            |
| Converting sync-only `finally` blocks         | Leave them; they are compliant                          |

## Migration Stance

Existing sync-only `finally` blocks are compliant and need no change. This policy applies
to cleanup that performs asynchronous work.

## Related Policies

- [Structured Concurrency](./structured-concurrency.md) - Teardown is how task lifetimes stay explicit
- [Small, Composable Units](./composable-units.md) - Uses `resource()` to isolate setup and teardown
- [Correctness Through Explicit Invariants](./correctness-invariants.md) - Halt is a path that must be tested
- [Policies Index](./index.md) - Add your new policy to the Policy Documents table
