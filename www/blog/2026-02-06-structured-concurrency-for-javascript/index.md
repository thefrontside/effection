---
title: "Why Structured Concurrency for JavaScript"
description: "Structured programming tamed the chaos of early computing. Structured concurrency does the same for async — and Effection brings it to JavaScript."
author: "Taras Mankovski"
tags: ["structured concurrency", "javascript", "effection"]
image: "structured-concurrency-js.svg"
---

Structured Programming was both a revelation _and_ a revolution when it happened
in the early 70s (before most of us programming today were even born). We take
our structured constructs for granted, but before them it was the Wild West:
crashes, leaks, infinite loops, and just difficulty reasoning about programs.
Structured Programming was created to rein in the chaos, and we benefit from it
every day of our lives even though most of us don't perceive it because it's
like having a clean water supply and pure air to breathe.

Structured concurrency is the re-application of this very sound knowledge to
concurrency — binding the lifecycle of asynchronous operations to the structure
of the program. For the longer historical perspective, Nathaniel J. Smith's
[Notes on structured concurrency (or: Go statement considered harmful)](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/)
is the classic.

Here's what I mean: if I start some concurrent work inside a block of code, that
work should have a clear owner and a natural lifetime, and it should reliably
clean up when that block is done. The picture at the top shows exactly that:
child work lives _inside_ the scope that started it, and when the parent scope
ends, everything inside stops.

```js
function* myTask() {
  yield* spawn(function* () {
    try {
      yield* suspend();
    } finally {
      console.log("cleaned up");
    }
  });
  // when myTask ends, the spawned work is halted
  // and its finally{} runs
}
```

It's quickly becoming a standard for event-heavy programming languages. Kotlin
coroutines lean hard into it. Swift has task groups. Python added `TaskGroup` in
3.11.
[Java 21](https://docs.oracle.com/en/java/javase/21/core/structured-concurrency.html)
ships a structured concurrency API. Even Go, which doesn't have it built-in, has
libraries like [`conc`](https://github.com/sourcegraph/conc) that bring scoped
concurrency to goroutines. Structured concurrency is where concurrency is
headed.

JavaScript doesn't give you this today.

## Where JavaScript Async Breaks

Without Promises in the picture, JavaScript gives you reliable expectations: a
function runs to completion unless it throws, `finally {}` runs when control
leaves a `try` block, and when a scope ends, the things owned by that scope are
done.

But as soon as you introduce a single Promise, it corrupts the entire
programming model. You `await` something inside a function, but the work you
kicked off keeps running even after the caller has moved on. Promises are eager,
unstructured, and not cancellable. You can signal cancellation to some APIs with
`AbortSignal`, but you can't force a promise to unwind and run cleanup.

In practice this means: code in `finally {}` blocks does not necessarily run.
Cancellation is a convention rather than a guarantee. You end up threading
`AbortSignal` through layers of code just to get something resembling
interruption. Leaked timers, ports, and listeners become common failure modes.
It's the Wild West of the 70s all over again — just async this time.

This broken model has been with us for so long that most developers have learned
to live with it — accepting that closing a CLI leaves orphaned processes, that
async work keeps running in the browser long after it's needed, chipping away at
performance. Deep down we know something isn't right, but fixing it feels like
it requires a whole different paradigm — Observables, maybe — so we reach for
workarounds and move on.

For the deeper explanation, see
[The Await Event Horizon](https://frontside.com/blog/2023-12-11-await-event-horizon)
and
[The Heartbreaking Inadequacy of Abort Controller](https://frontside.com/blog/2025-08-04-the-heartbreaking-inadequacy-of-abort-controller/).

## What Effection Changes

Effection makes async code feel like it has the same structure that our
synchronous code has had for decades. The structured-concurrency part comes down
to two guarantees:

1. No operation runs longer than its parent.
2. Every operation exits fully (cleanup runs).

Here's what that looks like:

```js
import { main, sleep, spawn, suspend } from "effection";

await main(function* () {
  yield* spawn(function* () {
    try {
      yield* suspend(); // wait until told to stop
    } finally {
      console.log("background task cleaned up");
    }
  });

  yield* sleep(1000);
  console.log("main done");
  // when main exits, the spawned task is halted
  // and its finally{} block runs — guaranteed.
});
```

You still reach for `if`, `for`, `while`, and `try/catch/finally`. The main
difference is that where you would normally write `await`, you use `yield*`
inside a generator function. If you're coming from `async/await`, the mapping is
in the [Async Rosetta Stone](/docs/async-rosetta-stone).

On top of the structured-concurrency foundation, Effection gives you
[context](/docs/context) (scoped values without parameter plumbing) and
[streams](/docs/collections) (a minimal stream primitive that follows the same
scope rules). Both are opt-in.

Effection is small on purpose. Async should just feel normal.
