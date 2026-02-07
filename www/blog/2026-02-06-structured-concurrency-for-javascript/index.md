---
title: "Why Structured Concurrency for JavaScript"
description: "Structured programming tamed the chaos. Structured concurrency applies the same idea to async work, so cleanup and cancellation are scope-owned and reliable."
author: "Taras Mankovski"
tags: ["structured concurrency", "javascript", "effection"]
image: "structured-concurrency-js.svg"
---

Structured Programming was both a revelation _and_ a revolution when it happened
in the early 70s (before most of us programming today were even born). We take
our structured constructs for granted, but it was the Wild West and it was
terrible: crashes, leaks, infinite loops, and just difficulty reasoning about
programming.

Structured Programming was created to rein in the chaos. We know it's a good
principle, and we benefit from it every day of our lives even though most of us
don't perceive it because it's the air we breathe and the water we drink... it's
like having a clean water supply to drink and pure air to breathe.

Structured concurrency is the re-application of this very sound knowledge to
concurrency.

If you want the longer version of the argument (and a lot more historical and
practical context), Nathaniel J. Smith's
[Notes on structured concurrency (or: Go statement considered harmful)](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/)
is the classic.

That's a fancy name for a pretty ordinary idea: if I start some concurrent work
inside a function/scope, it should have a clear owner, a natural lifetime, and
it should reliably clean up when that scope is done.

The picture at the top is trying to show exactly that: child work lives _inside_
the scope that started it, and when the parent scope ends (that big arrow on the
right), everything inside has a natural place to stop.

If you look around, you can see versions of this idea showing up in more places:
Kotlin coroutines lean hard into it, Swift has task groups, Python added
`TaskGroup` in 3.11, and Java has it in the JDK (Java 21 ships a structured
concurrency API as a preview feature:
[Structured Concurrency (Java 21)](https://docs.oracle.com/en/java/javase/21/core/structured-concurrency.html).

Go doesn't have it built-in, but it has libraries that get you most of the way
there (for example [`errgroup`](https://pkg.go.dev/golang.org/x/sync/errgroup)).

## Structured Programming vs Structured Concurrency

Structured programming is what we do when we build programs out of familiar
language constructs like `if/else`, `switch`, `try/catch/finally`, `for`, and
`while`. Those constructs give code a shape that both humans and tooling can
rely on.

One big downstream benefit is that the runtime can automate stuff that would
otherwise be manual and error-prone. Garbage collection is the classic example:
most of the time, you don't have to think about manually freeing memory because
memory lifetime is (mostly) bound to scope.

Structured concurrency is basically saying: cool, can we do the same thing for
effects that happen over time?

- timers
- sockets
- event listeners
- subprocesses
- in-flight requests

In a structured concurrency model, those effects are bound to the scope that
started them. When the scope ends, the runtime (or framework) has a well-defined
place to shut everything down.

And this is where things get spicy in JavaScript.

## Where JavaScript Async Breaks the Structure

In synchronous JavaScript, we have reliable expectations:

- A function runs to completion unless it throws.
- `finally {}` runs when control leaves a `try` block.
- When a scope ends, the things owned by that scope are done.

In JavaScript's built-in async model, those expectations are unreliable. The
core unit of async composition is the `Promise`, and promises are:

- eager: creating a promise (or calling an `async` function) starts work
  immediately
- unstructured: there is no parent/child relationship that the runtime enforces
- not cancellable: you can signal cancellation to some APIs with `AbortSignal`,
  but you can't force a promise (or an `async` function) to unwind and run
  cleanup

So in real life, this turns into a bunch of extra work if you're trying to write
correct programs:

- Shutdown is hard to do reliably; code in `finally {}` blocks does not
  necessarily run (see
  [The Await Event Horizon](https://frontside.com/blog/2023-12-11-await-event-horizon)).
- Cancellation becomes a convention rather than a guarantee.
- You end up threading `AbortSignal` through layers of code (and through
  third-party APIs) just to get something resembling interruption.
- Leaked timers, ports, listeners, and "in-flight work nobody cares about
  anymore" become common failure modes.

If you want the deeper "why does the platform behave like this" explanation, the
full write-up is here:
[The Await Event Horizon](https://frontside.com/blog/2023-12-11-await-event-horizon).

## What Effection Changes

Effection is built to make concurrency behave more like the rest of JavaScript:
scoped, predictable, and composable.

In other words, it's an attempt to make async code feel like it has the same
"structure" that our synchronous code has had for decades.

When we say "Effection is structured concurrency and effects for JavaScript",
the structured-concurrency part really comes down to two guarantees:

1. No operation runs longer than its parent.
2. Every operation exits fully (cleanup runs).

Effection does this by basing async composition on operations (lazy recipes for
work) instead of promises (eager work-in-progress), and by making cancellation
and cleanup part of the execution model.

If you want the canonical explanation of these guarantees, start here:
[/docs/thinking-in-effection](/docs/thinking-in-effection).

## "Just JavaScript" Control Flow

Effection is intentionally designed so that the control flow you already know is
still the control flow you use. You still reach for `if`, `for`, `while`, and
`try/catch/finally`. The main difference is that where you would normally write
`await`, you use `yield*` inside a generator function.

If you're coming from `async/await`, the mapping is captured in the
[/docs/async-rosetta-stone](/docs/async-rosetta-stone).

## Extra Power-Ups (Optional)

Once you have the structured-concurrency foundation, Effection also gives you a
couple of really nice (still scope-bound) tools when you want them:

- Context: a scoped context mechanism (similar in spirit to React context) for
  passing values without plumbing parameters. See
  [/docs/context](/docs/context).
- Streams and subscriptions: a minimal stream primitive that plays well with
  structured concurrency. See [/docs/collections](/docs/collections).

Effection is small on purpose: it tries to provide the minimum set of primitives
needed to make concurrent JavaScript feel normal again.
