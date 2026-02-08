---
title: "Why JavaScript Needs Structured Concurrency"
description: "Structured programming tamed the chaos of early computing. Structured concurrency does the same for async — and Effection brings it to JavaScript."
author: "Taras Mankovski"
tags: ["structured concurrency", "javascript", "effection"]
image: "structured-concurrency-js.svg"
---

You hit Ctrl-C. The CLI exits. And yet the port is still bound.

Or you navigate away in the browser, and a request you no longer care about
keeps running anyway — burning battery, holding sockets, and calling callbacks
into code that has already moved on.

This is the part of JavaScript async we all learn to tolerate: work that
outlives the scope that started it.

Structured programming was created to rein in a similar kind of chaos in the
70s. We take our structured constructs for granted now, but before them it was
the Wild West: crashes, leaks, infinite loops, and programs that were hard to
reason about. People reached for `goto`, control flow jumped across the page,
and the shape of the program stopped matching how it ran. Structured concurrency
is the re-application of that same knowledge to concurrency — binding the
lifetime of concurrent work to the structure of the program.

For the longer historical perspective, Nathaniel J. Smith's
[Notes on structured concurrency (or: Go statement considered harmful)](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/)
is the classic.

Here's what I mean: if I start some concurrent work inside a block of code, that
work should have a clear owner and a natural lifetime, and it should reliably
clean up when that block is done. The picture at the top shows the difference:
on the left, work escapes the function boundary and leaks. On the right,
everything lives inside the scope that started it — and when that scope ends,
everything stops.

JavaScript had generator functions (`function*`) before `async/await` — and
generators are flexible enough to support structured concurrency because the
caller controls when they resume and when they stop.

But when `async/await` was standardized, the runtime gave the parent no way to
control the child — no halt, no forced cleanup — without modifying every
function signature in the chain. Effection builds on generators to fill what
`async/await` left out.

## Where Async Breaks JavaScript

In synchronous JavaScript, lifetimes are boring in a good way: a function runs
to completion unless it throws, and `finally {}` runs when control leaves the
`try` block. When the function returns, the work is over.

Async changes that. The moment you `await`, the work you started no longer has
to finish inside the scope that started it — your caller can move on while your
effects keep running. Promises are eager, unstructured, and not cancellable. You
can signal cancellation to some APIs with `AbortSignal`, but you can't force a
promise to unwind and run cleanup.

Here's the shape of the problem in plain `async` code:

```js
async function run() {
  const server = startServer(); // binds a port

  try {
    await fetch("https://example.com/slow");
  } finally {
    server.close(); // only runs if run() unwinds
  }
}

run();

// hard exit: no unwind, no cleanup
process.on("SIGINT", () => process.exit(0));
```

In practice, `finally {}` stops being a reliable place to put cleanup for the
async work you kicked off — because that work isn't bound to the scope that
created it, and you can't force it to unwind. Cancellation becomes a convention
rather than a guarantee. You end up threading `AbortSignal` through layers of
code just to get something resembling interruption. Leaked timers, ports, and
listeners become common failure modes. It's the Wild West of the 70s all over
again — just async this time.

This broken model has been with us for so long that most developers have learned
to live with it — accepting that closing a CLI leaves orphaned processes, that
async work keeps running in the browser long after it's needed, chipping away at
performance. Fixing it feels like it requires a whole different paradigm —
Observables, maybe — so we reach for workarounds and move on.

For the deeper explanation, see
[The Await Event Horizon](https://frontside.com/blog/2023-12-11-await-event-horizon)
and
[The Heartbreaking Inadequacy of Abort Controller](https://frontside.com/blog/2025-08-04-the-heartbreaking-inadequacy-of-abort-controller/).

The fix isn't more convention — it's the missing guarantee.

## What Effection Changes

Effection makes async code feel like it has the same structure that our
synchronous code has had for decades. The structured concurrency part comes down
to two guarantees:

1. No operation runs longer than its parent.
2. Every operation exits fully (cleanup runs).

That's the difference between "the port is still bound" and "cleanup actually
runs."

It's quickly becoming a standard for event-heavy programming languages. Kotlin
coroutines lean hard into it. Swift has task groups. Python added `TaskGroup` in
3.11.
[Java 21](https://docs.oracle.com/en/java/javase/21/core/structured-concurrency.html)
ships a structured concurrency API. Even Go, which doesn't have it built-in, has
libraries like [`conc`](https://github.com/sourcegraph/conc) that bring scoped
concurrency to goroutines. Structured concurrency is where concurrency is
headed.

Here's what that looks like:

```js
import { main, sleep, spawn } from "effection";

await main(function* () {
  yield* spawn(function* () {
    try {
      yield* sleep(30_000); // long-running timer
    } finally {
      console.log("timer cleaned up");
    }
  });

  yield* sleep(1000);
  console.log("main done");
  // when main exits, the spawned task is halted
  // and its finally {} block runs — guaranteed.
});
```

And `main()` takes care of the ugly host integration: in Node/Deno it traps
SIGINT/SIGTERM, and in the browser it shuts down on `unload`, so your scopes
halt and `finally {}` blocks run instead of being skipped by hard exits.

You still reach for `if`, `for`, `while`, and `try/catch/finally`. The main
difference is that where you would normally write `await`, you use `yield*`
inside a generator function. If you're coming from `async/await`, the mapping is
in the [Async Rosetta Stone](/docs/async-rosetta-stone). For the mental model,
see [Thinking in Effection](/docs/thinking-in-effection). For spawning
specifically, see [spawn](/docs/spawn).

## Structured Concurrency for JavaScript

Structured concurrency isn't so much new as it is overdue: it's the missing
guarantee that makes async behave like you already expect. Effection stays small
because it doesn't ask you to change how you write programs; it fills in what
the runtime doesn't guarantee by default so shutdown becomes normal control flow
instead of a special case. When the program ends — Ctrl-C, SIGTERM, navigation,
cancellation — your concurrent work halts cleanly instead of leaking past the
scope that started it.

Effection is small on purpose, so async should just feel normal.
