---
title: "Why JavaScript Needs Structured Concurrency"
description: "Structured programming tamed the chaos of early computing. Structured concurrency does the same for async — and Effection brings it to JavaScript."
author: "Taras Mankovski"
tags: ["structured concurrency", "javascript", "effection"]
image: "structured-concurrency-js.svg"
---

You hit Ctrl-C. The CLI exits. And yet the port is still bound.

Or a component unmounts in your SPA, and the requests it started keep running
anyway — burning battery, holding sockets, and calling callbacks into code that
has already moved on.

This is the part of JavaScript async we all learn to tolerate: work that
outlives the scope (the lifetime boundary) that started it.

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

Now here's where the shape of the program stops matching how it runs. Effection
is one way to bring that guarantee back to JavaScript — but first, it helps to
name the failure mode clearly.

## Where Async Breaks JavaScript

In synchronous JavaScript, lifetimes are boring in a good way: a function runs
to completion unless it throws, and `finally {}` runs when control leaves the
`try` block. When the function returns, the work is over.

Async changes that. Once you start async work by creating a Promise, the caller
has two bad options: await it (possibly forever), or move on while the work
keeps running past the caller's lifetime boundary. Either way, there's nothing
built in that can halt it and force cleanup to run — unless you explicitly
thread cancellation through the call chain.

Here's the shape of the problem in plain `async` code:

```js
async function run() {
  const server = startServer(); // spawns a child process that binds a port

  try {
    await fetch("https://example.com/slow");
  } finally {
    server.kill(); // only runs if run() unwinds
  }
}

// hard exit: parent dies, child keeps running
process.on("SIGINT", () => process.exit(0));

run();
```

When `async/await` was standardized, it didn't come with parent-to-child control
— no built-in halt, no guaranteed cleanup — unless every function in the chain
opts in (e.g. via `AbortSignal`). In practice, `finally {}` stops being a
reliable place to put cleanup for the async work you kicked off — because that
work isn't bound to the scope that created it, and you can't force it to unwind.
Cancellation becomes a convention rather than a guarantee. You end up threading
cancellation signals through layers of code just to get something resembling
interruption. Leaked timers, ports, and listeners become common failure modes.
It's the Wild West of the 70s all over again — just async this time.

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

It's quickly becoming the default shape of concurrency: Kotlin, Swift, Python
3.11, and
[Java 21](https://docs.oracle.com/en/java/javase/21/core/structured-concurrency.html)
all ship it, and Go has libraries like
[`conc`](https://github.com/sourcegraph/conc) that approximate it.

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

Effection is not a large library. It is small and simple by design, so that
async can be bulletproof and still feel normal.
