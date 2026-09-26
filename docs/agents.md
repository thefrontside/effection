# AGENTS.md — Effection agent contract

This file is the behavioral contract for AI agents writing applications with
Effection.

Agents must not invent APIs, must not infer semantics from other ecosystems, and
must ground claims in the public API.

If you are unsure whether something exists, consult the API reference:
https://frontside.com/effection/api/

## Core invariants (do not violate)

### Operations vs Promises

- **Operations** are lazy. They execute only when interpreted (e.g. `yield*`,
  `run()`, `Scope.run()`, `spawn()`).
- **Promises** are eager. Creating a promise (or calling an `async` function)
  starts work; `await` only observes completion.
- You must not claim that a promise is "inert until awaited".
- You must not use `await` inside a generator function (`function*`). Use
  `yield*` with an operation instead (e.g. `yield* until(promise)`).

### Structured concurrency is scope-owned

- Scope hierarchy is created automatically by the interpreter; application code
  should not manage scopes manually.
- "Lexical" in Effection: scope hierarchy follows the lexical structure of
  operation invocation sites (e.g. `yield*`, `spawn`, `Scope.run`), not where
  references are stored or later used.
- Work is owned by **Scopes**.
- When a scope exits, all work created in that scope is halted.
- References do not extend lifetimes. Returning a `Task`, `Scope`, `Stream`, or
  `AbortSignal` does not keep it alive.

### Effects do not escape scopes

- Values may escape scopes.
- Ongoing effects must not escape: tasks, resources, streams/subscriptions, and
  context mutations must remain scope-bound.

## Operations, Futures, Tasks

### Operation

- An `Operation<T>` is a recipe for work. It does nothing by itself.
- Operations are typically created by invoking a generator function
  (`function*`).

### Future

- A `Future<T>` is both:
  - an Effection operation (`yield* future`)
  - a Promise (`await future`)

### Task

- A `Task<T>` is a `Future<T>` representing a concurrently running operation.
- A task does not own lifetime or context; its scope does.

## Entry points and scope creation

### `main()`

- You should prefer `main()` when writing an entire program in Effection.
- Inside `main()`, prefer `yield* exit(status, message?)` for termination; do
  not call `process.exit()` / `Deno.exit()` directly (it bypasses orderly
  shutdown).

### `exit()`

- `exit()` is an operation intended to be used from within `main()` to initiate
  shutdown.

### `run()`

- You may use `run()` to embed Effection into existing async code.
- `run()` starts execution immediately; awaiting the returned task only observes
  completion.

### `createScope()`

- You must not use `createScope()` for normal Effection application code.
- You may use `createScope()` only for **integration** between Effection and
  non-Effection lifecycle management (frameworks/hosts/embedders).
- You must observe `destroy()` (`await` / `yield*`) to complete teardown.
  Calling `destroy()` without observation does not guarantee shutdown
  completion.

### `useScope()`

- Use `yield* useScope()` to capture the current `Scope` for integration (e.g.
  callbacks) and re-enter Effection with `scope.run(() => operation)`.

## `spawn()`

**Shape (canonical)**

```ts
const op = spawn(myOperation); // returns an OPERATION
const task = yield * op; // returns a TASK (Future) and starts it
```

**Rules**

- `spawn()` does not start work by itself. Yielding the spawn operation starts
  work.
- Yielding `spawn()` does not guarantee that the child has reached any
  particular point in its body before the parent continues.
- A spawned task must not outlive its parent scope.

## `Task.halt()`

**Rules**

- `task.halt()` returns a `Future<void>`. You must observe it (`await` /
  `yield*` / `.then()`), or shutdown is not guaranteed to complete.
- `halt()` represents teardown. It can succeed even if the task failed.
- If a task is halted before completion, consuming its value (`yield* task` /
  `await task`) fails with `Error("halted")`.

## Scope vs Task (ownership)

| Concept | Owns lifetime | Owns context |
| ------- | ------------: | -----------: |
| `Scope` |            ✅ |           ✅ |
| `Task`  |            ❌ |           ❌ |

## Context API (strict)

**Valid APIs**

- `createContext<T>(name, defaultValue?)`
- `yield* Context.get()`
- `yield* Context.expect()`
- `yield* Context.set(value)`
- `yield* Context.delete()`
- `yield* Context.with(value, operation)`

**Rules**

- You must treat context as scope-local. Children inherit from parents; children
  may override without mutating ancestors.
- You must not treat context as global mutable state.

## `race()`

**Rules**

- `race()` accepts an array of operations.
- It returns the value of the first operation to complete.
- It halts all losing operations.

## `all()`

**Rules**

- `all()` accepts an array of operations and evaluates them concurrently.
- It returns an array of results in input order.
- If any member errors, `all()` errors and halts the other members.
- If you need all results regardless of success or failure, use `allSettled()`
  instead of wrapping each member in railway-style results.

## `allSettled()`

**Rules**

- `allSettled()` accepts an array of operations and evaluates them concurrently.
- It returns an array of `Result<T>` objects in input order
  (`{ ok: true, value }` or `{ ok: false, error }`).
- It never short-circuits on error — all operations run to completion.
- It is analogous to `Promise.allSettled()`, but uses Effection's `Result<T>`
  shape.

## `call()`

**Rules**

- `call()` invokes a function that returns a value, promise, or operation.
- `call()` does not create a scope boundary and does not delimit concurrency.
- If you need to report failures without throwing (e.g. so other work can
  continue), catch errors and return a railway-style result object instead of
  letting the error escape.

## `lift()`

**Rules**

- `lift(fn)` returns a function that produces an `Operation` which calls `fn`
  when interpreted (`yield*`), not when created.

## `action()`

**Rules**

- Use `action()` to wrap callback-style APIs when you can provide a cleanup
  function.
- You must not claim `action()` creates an error or concurrency boundary; it
  does not.

## `until()`

**Rules**

- `until(promise)` adapts an already-created `Promise` into an `Operation`.
- Prefer `until(promise)` over `call(() => promise)` when you have a promise—it
  is shorter and clearer.
- It does not make the promise cancellable; for cancellable interop, prefer
  `useAbortSignal()` with APIs that accept `AbortSignal`.

## `scoped()`

**Rules**

- Use `scoped()` to create a boundary such that effects created inside do not
  persist after it returns.
- You must use `scoped()` (not `call()`/`action()`) when you need boundary
  semantics.

## `resource()`

**Shape (ordering matters)**

```ts
// synchronous teardown
resource(function* (provide) {
  try {
    yield* provide(value);
  } finally {
    cleanup();
  }
});

// asynchronous teardown — ensure(), never finally
resource(function* (provide) {
  yield* ensure(function* () {
    yield* cleanup();
  });

  yield* provide(value);
});
```

**Rules**

- Setup happens before `provide()`.
- Synchronous cleanup must be in `finally` (or after `provide()` guarded by
  `finally`) so it runs on return/error/halt.
- Teardown can be asynchronous, but asynchronous teardown must go in `ensure()`.
  Do not fire-and-forget cleanup.
- You must not `yield*` inside a `finally`. See the rationale under `ensure()`.

## `ensure()`

**Rules**

- `ensure(fn)` registers cleanup to run when the current operation shuts down.
- `fn` may return `void` (sync cleanup) or an `Operation` (async cleanup).
- You should wrap sync cleanup bodies in braces so the function returns `void`.
- **Cleanup that needs `yield*` must use `ensure()`, not a `finally` block.**

**Why `yield*` in a `finally` is unsafe**

When a task is halted, a coroutine is unwound by calling `iterator.return()` on
its generator. If a `finally` block then yields, the generator suspends _inside_
the finally and reports `{ done: false }`, so the routine resumes it with
`iterator.next()` — and that takes the frame out of return-mode. The frame is no
longer unwinding, so once cleanup finishes, execution continues past the
operation that was being halted. The halt is lost.

This is the defect fixed inside `scoped()` in #1185: `iter.return()` yielded the
`destroy()` effects in scoped's finally, but the resume came back as
`iter.next()`. `scoped()` re-arms the unwind explicitly via `trap.exit()`.
Ordinary user code has no way to do that.

`ensure()` is not affected. It is implemented as a `resource()`, so its
`finally` runs in its own task frame with nothing after it, and it is driven by
scope destruction — which `createTask` wraps in `critical()`, making it
non-interruptible.

**Gotchas**

- `ensure()` registers on the **current scope**, and `call()` does not create
  one — it delegates to the target's iterator in the same coroutine frame. An
  `ensure()` inside `call(function* () { ... })` attaches to the _enclosing
  task's_ scope and fires far too late. Use `scoped()` or `spawn()` when you
  need a boundary. Note that `scoped()`'s own async teardown was not correct
  until 4.1, so code supporting older versions should prefer `spawn()`.
- Scope destructors run in **reverse order of registration**. Register the
  `ensure()` where the `try {` would have been — after any `spawn()` calls its
  cleanup depends on — so cleanup still runs while those children are alive.

## `useAbortSignal()`

**Rules**

- `useAbortSignal()` is an interop escape hatch for non-Effection APIs that
  accept `AbortSignal`.
- The returned signal is bound to the current scope and aborts when that scope
  exits (return, error, or halt).
- You should pass the signal to a **leaf** async API call, not thread it through
  a nested async stack.
- If the choice is "thread an AbortSignal through a nested async stack" vs
  "rewrite in Effection", you should prefer rewriting in Effection.

**Gotchas**

- You must not assume AbortController provides structured-concurrency
  guarantees. See:
  https://frontside.com/blog/2025-08-04-the-heartbreaking-inadequacy-of-abort-controller/

## Streams, Subscriptions, Channels, Signals, Queues

### Stream and Subscription

- A `Stream<T, TClose>` is an operation that yields a `Subscription<T, TClose>`.
- A `Subscription` is stateful; values are observed via
  `yield* subscription.next()`.

### `on(target, name)` and `once(target, name)` (EventTarget adapters)

**Rules**

- `on()` creates a `Stream` of events from an `EventTarget`; listeners are
  removed on scope exit.
- `once()` yields the next matching event as an `Operation` (it is equivalent to
  subscribing to `on()` and taking one value).

### `sleep()`, `interval()`, `suspend()`

**Rules**

- `sleep(ms)` is cancellable: if the surrounding scope exits, the timer is
  cleared.
- `interval(ms)` is a `Stream` that ticks until the surrounding scope exits
  (cleanup clears the interval).
- `suspend()` pauses indefinitely and only resumes when its enclosing scope is
  destroyed.

### `each(streamOrSubscription)` (loop consumption)

**Rules**

- `each()` accepts either a `Stream` or an existing `Subscription`, including a
  `Queue`.
- Passing a `Stream` subscribes when `yield* each(stream)` is interpreted.
- Passing a `Subscription` to `each()` consumes that exact subscription; it does
  not create another subscription.
- You must call `yield* each.next()` exactly once at the end of every loop
  iteration.
- You must call `yield* each.next()` even if the iteration ends with `continue`.

**Subscription readiness across `spawn()`**

- If a spawned consumer must receive values sent immediately afterward, create
  the subscription in the enclosing scope before spawning, then iterate that
  subscription in the child.
- Do not use `yield* sleep(0)` after `spawn()` as a subscription-readiness
  barrier.
- For `Channel` and `Signal`, values sent after `yield* stream` returns are
  queued for that active subscription even if the child has not begun iterating.
  Values sent before the subscription is active are still dropped.
- Passing a subscription to a child does not transfer or extend its lifetime.
  The scope that created it must remain active for the consumer's full lifetime.
- Treat a subscription as a single consumer. For broadcast consumption, create
  one subscription per consumer before sending values.

**Gotchas**

- If you do not call `each.next()`, the loop throws `IterationError` on the next
  iteration.
- Leaving `each(subscription)` does not close that subscription. It remains
  active until its owning scope exits.

**Shape (ordering matters)**

```ts
for (let value of yield * each(stream)) {
  // ...
  yield * each.next();
}
```

**Shape (subscribe before spawning)**

```ts
await main(function* () {
  let channel = createChannel<string>();
  let subscription = yield* channel;

  let consumer = yield* spawn(function* () {
    for (let value of yield* each(subscription)) {
      // ...
      yield* each.next();
    }
  });

  // Safe immediately: the subscription is already active.
  yield* channel.send("hello");
  yield* channel.close();
  yield* consumer;
});
```

### Channel vs Signal vs Queue

| Concept   | Send from                      | Send API                  | Requires subscribers    | Buffering                       |
| --------- | ------------------------------ | ------------------------- | ----------------------- | ------------------------------- |
| `Channel` | inside operations              | `send(): Operation<void>` | yes (otherwise dropped) | per-subscriber while subscribed |
| `Signal`  | outside operations (callbacks) | `send(): void`            | yes (otherwise no-op)   | per-subscriber while subscribed |
| `Queue`   | anywhere (single consumer)     | `add(): void`             | no                      | buffered (single subscription)  |

### `Channel`

**Rules**

- Use `createChannel()` to construct a `Channel`.
- Use `Channel` for communication between operations.
- You must `yield* channel.send(...)` / `yield* channel.close(...)`.
- You must assume sends are dropped when there are no active subscribers.

### `Signal`

**Rules**

- Use `createSignal()` to construct a `Signal`.
- Use `Signal` only as a bridge from synchronous callbacks into an Effection
  stream.
- You must not use `Signal` for in-operation messaging; use `Channel` instead.
- You must assume `signal.send(...)` is a no-op if nothing is subscribed.

### `Queue`

**Rules**

- Use `createQueue()` to construct a `Queue`.
- You may use `Queue` when you need buffering independent of subscriber timing
  (single consumer).
- A `Queue` is already a `Subscription`; consume it via `yield* queue.next()` or
  iterate it with `each(queue)`.

## `subscribe()` and `stream()` (async iterable adapters)

**Rules**

- Use `subscribe(asyncIterator)` to adapt an `AsyncIterator` to an Effection
  `Subscription`.
- Use `stream(asyncIterable)` to adapt an `AsyncIterable` to an Effection
  `Stream`.
- You must not treat JavaScript async iterables as Effection streams without
  wrapping.
- You must not use `for await` inside a generator function. Use `stream()` to
  adapt the async iterable, then `each()` to iterate.

**Shape (async iterable consumption)**

```ts
for (const item of yield * each(stream(asyncIterable))) {
  // ...
  yield * each.next();
}
```

## `withResolvers()`

**Rules**

- `withResolvers()` creates an `operation` plus synchronous `resolve(value)` /
  `reject(error)` functions.
- After resolve/reject, yielding the `operation` always produces the same
  outcome; calling resolve/reject again has no effect.
