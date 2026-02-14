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
is only a signal. It tells listeners to begin cancellation work; it does not
tell you that work finished. If one layer ignores the signal, or handles it
partially, work keeps running after the caller believes the task is over.
`abort()` is a request, not a guarantee, and that gap is where orphaned work
comes from.

## The leak

Here's what a hidden leak looks like: you call `abort()`, it returns, the
promise rejects, the caller awaits completion — but the interval keeps ticking
forever.

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
  // Orphaned: no cancellation boundary
  setInterval(() => console.log("tick: STILL RUNNING"), 200);

  await new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")), {
      once: true,
    });
  });
}
```

The interval is never tied to the signal. When `abort()` fires, the promise
rejects, the task appears to end, but the timer survives. From the call site,
lifecycle looks complete. From the runtime, it's not. This is how leaks hide in
plain sight: the code that initiated cancellation has no direct way to confirm
shutdown actually finished.

## Why this happens

`abort()` dispatches an event and returns. The signal is synchronous; the
consequences are not — and the platform provides no primitive to wait for those
consequences to finish. Teardown happens in listener code spread across your
stack, depending on each function honoring the signal and forwarding it to
whatever it calls. Miss it once and the chain breaks.

This is not a flaw in AbortController's design so much as a limit of what
cancellation can express without structured lifetimes. **AbortController
propagates intent; structured concurrency propagates ownership.** Intent is
advisory: every layer must cooperate. Ownership is structural: the parent scope
ensures children cannot outlive it. Correctness should not depend on discipline
across an unbounded stack.

## Structured lifetimes in practice

In structured concurrency, a child cannot outlive its parent. When scope exits,
child work is canceled and awaited before control continues. Cleanup is
guaranteed unless you opt out.

Here's the same work shape, but with structural ownership:

```js
import { main, scoped, sleep, spawn } from "effection";

await main(function* () {
  yield* scoped(function* () {
    yield* spawn(function* ticker() {
      while (true) {
        console.log("tick: RUNNING");
        yield* sleep(200);
      }
    });

    yield* sleep(700);
    console.log(">>> leaving scope");
  });

  console.log(">>> scope exited; all children are stopped");
});
```

When the scoped block exits, the ticker is halted and fully unwound before the
next line runs. No manual signal forwarding. No hidden background survivors.

The same applies to real resources: fetch requests, WebSockets, child processes.
In Effection, resource operations are written as generators that tie cleanup to
scope exit — so a fetch that never completes gets aborted when the parent scope
closes, a WebSocket closes its connection, a process is killed. The pattern is
the same: scope exit = guaranteed shutdown.

## Close

Structured lifetimes change the default: cleanup becomes automatic, and leaking
becomes the thing you have to go out of your way to do.
[Effection](https://frontside.com/effection) delivers this for JavaScript —
seven years in production, from trading platforms to CLI tools. For the full
technical critique of AbortController, see
[The Heartbreaking Inadequacy of AbortController](https://frontside.com/blog/2025-08-04-the-heartbreaking-inadequacy-of-abort-controller/).
