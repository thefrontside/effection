---
title: "AbortController.abort() Doesn't Mean It Stopped"
description: "controller.abort() fires an event and returns immediately, but cleanup depends on every function honoring the signal. Structured concurrency inverts the default: scope owns lifetime, cleanup is automatic."
author: Taras Mankovski
tags:
  - JavaScript
  - Structured Concurrency
  - AbortController
image: abortcontroller-abort.svg
---

## The false promise

You called `controller.abort()`, it returned, and then the logs kept coming, the
socket stayed open, or the process still owned the port after Ctrl-C. This is
the trap: calling `abort()` on an `AbortController` looks like shutdown, but it
is only a signal. It tells listeners to begin cancellation work, but it does not
tell you that the work finished. If one layer ignores the signal, or handles it
partially, work keeps running after the caller believes the task is over. In
other words, `abort()` is a request, not a guarantee, and that gap is how you
end up with code still running in the background after you thought you shut it
down.

## The leak

Here's what a hidden leak looks like: you call `abort()`, the promise rejects,
and the caller awaits completion. The interval keeps ticking.

```js
(async () => {
  const controller = new AbortController();

  const done = task(controller.signal).catch((e) => {
    console.log("task ended with:", e.message);
  });

  setTimeout(() => {
    console.log(">>> calling abort()");
    controller.abort();
    console.log(">>> abort() returned");
  }, 700);

  await done;
  console.log(">>> caller thinks everything is done");
  // But "tick: STILL RUNNING" continues forever
})();

async function task(signal) {
  // Leaks: no cancellation boundary
  setInterval(() => console.log("tick: STILL RUNNING"), 200);

  await new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")), {
      once: true,
    });
  });
}
```

When `abort()` fires, the promise rejects, and the task appears to end, but the
interval survives. From the call site, the lifecycle looks complete, but from
the runtime, it's not.

Leaks hide in plain sight when `abort()` gives you no confirmation that
cancellation actually finished.

This is because `abort()` dispatches an event to a set of listeners and returns
immediately. But while the signal is synchronous, the consequences don't have to
be. There can be any number of async things that have to happen in response to
the signal, and without a primitive to wait for them to finish, you're left
trusting that every layer cleaned up on its own.

That trust is the limit of what cancellation can express without structured
lifetimes. AbortController propagates an _intent_ to cancel only, but
cooperation with that intent is voluntary at every level. By contrast,
Structured Concurrency propagates _ownership_ which a parent scope can use to
ensure that its children do not outlive it. This is a superior model because
**Correctness does not depend on discipline maintained across every layer of the
call chain**, it is just the default behavior.

## Structured lifetimes in practice

In Structured Concurrency, we say that a child cannot outlive its parent. What
this means is that when a scope exits, any child work is canceled and its
teardown fully awaited before control can continue. Guaranteed.

To demonstrate this, here is the same work as above, but with structural
ownership instead of signaled intent. If you want this model in JavaScript,
[Effection](https://frontside.com/effection) has been delivering it for seven
years in production, from trading platforms to CLI tools:

```js
import { main, sleep, spawn } from "effection";

await main(function* () {
  yield* spawn(function* ticker() {
    while (true) {
      console.log("tick: RUNNING");
      yield* sleep(200);
    }
  });

  yield* sleep(700);
  console.log(">>> exiting main");
});

console.log(">>> main exited; all children are stopped");
```

When the main operation exits, the ticker is halted and fully unwound before the
next line runs. No manual signal forwarding and no hidden background survivors.

The same applies to real resources, as long as they're owned by the scope. If a
fetch is started with a scope-bound `AbortSignal` (via `useAbortSignal()`), or a
WebSocket/process is wrapped in a `resource()` with teardown in `finally`, then
leaving the scope halts it and waits for cleanup to finish.

## Takeaway

`AbortController#abort()` is a wish. Structured lifetimes are a guarantee.

For the full technical critique of AbortController, see
[The Heartbreaking Inadequacy of AbortController](https://frontside.com/blog/2025-08-04-the-heartbreaking-inadequacy-of-abort-controller/).
