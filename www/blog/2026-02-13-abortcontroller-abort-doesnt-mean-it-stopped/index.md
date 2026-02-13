---
title: "AbortController.abort() Doesn't Mean It Stopped"
author: Taras Mankovski
tags:
  - JavaScript
  - Structured Concurrency
  - AbortController
---

## The false promise

You called `abort()`, it returned, and then the logs kept coming, the socket
stayed open, or the process still owned the port after Ctrl-C. This is the trap:
`AbortController.abort()` looks like shutdown, but it is only a signal. It tells
listeners to begin cancellation work; it does not tell you that work finished.
If one layer ignores the signal, or handles it partially, work keeps running
after the caller believes the task is over. `abort()` is a request, not a
guarantee, and that gap is where orphaned work comes from.

## The leak

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
})();

async function task(signal) {
  // This never gets cleaned up
  setInterval(() => console.log("tick: STILL RUNNING"), 200);

  await new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")), {
      once: true,
    });
  });
}
```

Run this and follow the sequence.

At ~700ms, `abort()` is called. It returns immediately. The promise waiting on
the signal rejects, so `task()` appears to end with `"aborted"`. The caller
awaits `done`, then prints `">>> caller thinks everything is done"`.

But `tick: STILL RUNNING` continues forever.

That interval is not tied to any cancellation boundary. It is just process state
now. The abort signal rejected one promise, but it did not unwind every side
effect created by the task. From the call site, lifecycle looks complete. From
the runtime, it is not. This is how leaks hide in plain sight: the code that
initiated cancellation has no direct way to confirm shutdown actually finished.

## Why this happens

`abort()` is synchronous in a narrow sense: it dispatches an event and returns.
Everything that matters happens later, in listener code spread across your
stack. Cleanup depends on each function honoring the signal and forwarding it to
whatever it calls. Miss it once and the chain breaks. The platform also gives
you no completion primitive for cancellation itself. You can signal intent, but
you cannot await the end of cleanup as a first-class outcome.

## The deeper problem: opt-in cleanup

AbortController makes cleanup opt-in at every layer. Every function has to
participate. Every integration has to agree on behavior. Every `try/catch` path
has to preserve cancellation semantics. Most resource leaks happen because
someone forgot to add cleanup, not because they intentionally skipped it.

That is the real issue with the default. The system is only as safe as the least
careful frame in the call tree. Correctness should not depend on perfect
discipline across an unbounded stack. We need a model that inverts the default
so lifetime safety is automatic, not manually propagated.

## Scope owns lifetime

In structured concurrency, a child cannot outlive its parent. When scope exits,
child work is canceled and awaited before control continues. Cleanup is
guaranteed unless you opt out.

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

This is the same shape of work, but now lifetime is structural instead of
advisory. When the scoped block exits, the ticker is halted and fully cleaned up
before the next line runs. No manual signal forwarding. No hidden background
survivors. Cleanup happens automatically. You don't have to remember it.

## Close

For the full technical critique, read
[The Heartbreaking Inadequacy of AbortController](https://frontside.com/blog/2025-08-04-the-heartbreaking-inadequacy-of-abort-controller/).
Effection has run trading platforms in production for 7 years. Docs:
[frontside.com/effection](https://frontside.com/effection).
