---
title: "Structured Concurrency for JavaScript"
description: "Why JavaScript async falls short of structured concurrency, and how Effection makes cleanup and cancellation scope-owned and composable."
author: "Taras Mankovski"
tags: ["structured concurrency", "javascript", "effection"]
---

Structured concurrency is a programming paradigm like structured programming,
but applied to concurrency. The idea is simple: concurrent work should have a
clear _owner_, a clear _lifetime_, and predictable _cleanup_.

This model is no longer just theory. Variations of structured concurrency are
now present in a growing set of ecosystems: Kotlin coroutines emphasize
structured concurrency, Swift has task groups, Python added `TaskGroup` in 3.11,
and Java has explored it via Project Loom.

## Structured Programming vs Structured Concurrency

Structured programming is what we practice when we build programs out of
familiar language constructs like `if/else`, `switch`, `try/catch/finally`,
`for`, and `while`. Those constructs give code a _shape_ that both humans and
tooling can rely on.

One big downstream benefit is that it becomes possible to automate things that
would otherwise be manual and error-prone. For example, with garbage collection
we largely stop thinking about explicitly freeing memory because memory lifetime
is (mostly) bound to scope.

Structured concurrency applies the same idea to _effects that happen over time_:

- timers
- sockets
- event listeners
- subprocesses
- in-flight requests

In a structured concurrency model, these effects are bound to the scope that
started them. When the scope ends, the runtime (or framework) has a well-defined
place to shut everything down.

## Where JavaScript Async Breaks the Structure

In synchronous JavaScript, we have reliable expectations:

- A function runs to completion unless it throws.
- `finally {}` runs when control leaves a `try` block.
- When a scope ends, the things owned by that scope are done.

In JavaScript's mainstream async model, those expectations don't generalize. The
core unit of async composition is the `Promise`, and promises are:

- **eager**: creating a promise (or calling an `async` function) starts work
  immediately
- **unstructured**: there is no parent/child relationship that the runtime
  enforces
- **not cancellable**: you can signal cancellation to _some_ APIs with
  `AbortSignal`, but you can't force a promise (or an `async` function) to
  unwind and run cleanup

Practically, this means:

- Shutdown is hard to do reliably; code in `finally {}` blocks doesn't have to
  run if the process is torn down.
- Cancellation becomes a _convention_ rather than a guarantee.
- You end up threading `AbortSignal` through layers of code (and through
  third-party APIs) just to get something resembling interruption.
- Leaked timers, ports, listeners, and “in-flight work nobody cares about
  anymore” become common failure modes.

For a deeper explanation of the underlying limitation, see
[The Await Event Horizon](https://frontside.com/blog/2023-12-11-await-event-horizon).

## What Effection Changes

Effection is built to make concurrency behave like the rest of JavaScript:
scoped, predictable, and composable.

When we say “Effection is structured concurrency and effects for JavaScript”,
the structured-concurrency part comes down to two guarantees:

1. No operation runs longer than its parent.
2. Every operation exits fully (cleanup runs).

Effection achieves this by basing async composition on _operations_ (lazy
recipes for work) instead of promises (eager work in progress), and by making
cancellation and cleanup part of the execution model.

If you want the canonical explanation of these guarantees, start with
[/docs/thinking-in-effection](/docs/thinking-in-effection).

## “Just JavaScript” Control Flow

Effection is intentionally designed so that the control flow you already know
stays the control flow you use. You still reach for `if`, `for`, `while`, and
`try/catch/finally`. The main difference is that where you would normally write
`await`, you use `yield*` inside a generator function.

If you're coming from `async/await`, the mapping is captured in the
[/docs/async-rosetta-stone](/docs/async-rosetta-stone).

## Extra Power-Ups (Optional)

On top of the structured concurrency foundation, Effection includes additional
primitives that stay scope-bound:

- **Context**: a scoped context mechanism (similar in spirit to React context)
  for passing values without plumbing parameters. See
  [/docs/context](/docs/context).
- **Streams and subscriptions**: a minimal stream primitive that plays well with
  structured concurrency. See [/docs/collections](/docs/collections).

Effection is small on purpose: it tries to provide the minimum set of primitives
needed to make concurrent JavaScript feel normal again.
