---
title: "What is Strict Structured Concurrency?"
description: "In standard structured concurrency, background tasks can hold a scope open after the meaningful work is done. Strict structured concurrency corrects that lifetime model by reclaiming incidental work automatically."
author: "Charles Lowell"
image: strict-structured-concurrency.svg
---

When a scope completes its meaningful work, it should be done. That sounds
obvious, but the standard model of structured concurrency still leaves a hole in
the lifetime rules. If background tasks can hold a scope open after the
foreground computation is complete, then the scope remains open for work it no
longer structurally justifies.

That is not merely inconvenient. It is semantically wrong. Once background work
has equal structural standing with foreground computation, correctness stops
being a property of the model and becomes a burden on the programmer. Every
spinner, timeout, heartbeat, polling loop, and listener now carries an
incorrectness tax: forget to tear one down and an operation can hang, a request
can fail to return, or a support process can outlive the very work it was meant
to support.

In performance-sensitive systems, that tax is not abstract. Work that no longer
belongs to the computation can still retain resources, inflate latency, degrade
throughput, and make shutdown behavior unstable under load. Incorrect lifetime
semantics are operationally expensive.

Effection corrects that model with a stricter rule: **a child may not outlive
its parent.** When a scope exits, incidental background work is reclaimed
automatically. Cleanup still runs. `finally {}` blocks still run. Orderly
shutdown is preserved. But the scope does not remain open for work that no
longer contributes to its result. That refinement is what we call **strict
structured concurrency**.

## Foreground and background

The key distinction is between work that defines the computation and work that
merely supports it.

A **foreground** task is one whose result is explicitly consumed by the parent.
Its value is part of what the scope computes.

A **background** task is one whose result is never consumed by the parent. It
exists only to sustain some side-effect while the foreground runs.

Foreground tasks and background tasks should not have equal structural standing.
The lifetime of a foreground task is naturally aligned with the lifetime of its
scope. If the parent needs the value, then the task must complete before the
parent can complete. That is correctness by construction.

Background tasks are different. A spinner can run forever. A heartbeat can run
forever. A timeout can stay armed indefinitely. But once the foreground is done,
they have no further reason to exist.

A spinner whose download is complete? A heartbeat nobody is listening for? A
collector with no more metrics to flush? These are not tasks that need equal
standing with the computation. These are tasks that should simply go away.

## Where the failure shows up

Take a simple operation that fetches user data while showing a spinner:

```js
function* getUserInfo(userId) {
  let spinner = yield* spawn(function* () {
    yield* showSpinner({ style: "circle" });
  });

  let [user, groups] = yield* all([fetchUser(userId), fetchGroups(userId)]);

  yield* spinner.halt();

  return { ...user, groups };
}
```

Now add a timeout:

```js
function* getUserInfo(userId, timeoutMs) {
  let spinner = yield* spawn(function* () {
    yield* showSpinner({ style: "circle" });
  });

  let timeout = yield* spawn(function* () {
    yield* sleep(timeoutMs);
    throw new Error("timed out");
  });

  let [user, groups] = yield* all([fetchUser(userId), fetchGroups(userId)]);

  yield* spinner.halt();
  yield* timeout.halt();

  return { ...user, groups };
}
```

The spinner and the timeout are easy examples, but the issue is not that they
require a few extra lines of teardown. The issue is that under weaker lifetime
rules, support processes can continue to hold open a scope even after the
meaningful computation has completed. In real systems, that is how operations
hang, requests fail to return, and frameworks accumulate defensive cleanup logic
everywhere.

This is the cancellation tax. Not because cancellation is annoying, but because
the runtime has preserved work that is no longer structurally justified. Every
framework author inherits that burden and must manually defend against it at
every layer of abstraction.

From maintaining a keep-alive heartbeat on a WebSocket, to flushing OTEL
metrics, to polling for updates, the pattern is the same. The support process is
not the result. It should not decide when the scope is done.

## Structured concurrency as we know it

People who come to [Effection](https://frontside.com/effection) for the first
time, even those already familiar with structured concurrency from Python or
Swift, are often surprised by how aggressively it tears down child tasks.
They'll spawn a few concurrent operations, return from the parent, and discover
that every single child has been _cancelled_. Not joined. Not awaited.
Cancelled.

```js
import { run, sleep, spawn } from "effection";

await run(function* () {
  yield* spawn(function* () {
    yield* sleep(1000);
    console.log("one second");
  });

  yield* spawn(function* () {
    yield* sleep(2000);
    console.log("two seconds");
  });

  console.log("done");
});
```

This program prints `done` and exits right away. Both sleepers? Gone. If you're
coming from Python or Swift, this might feel wrong. In those systems, a parent
scope waits for all of its children to complete before it exits. That's _the_
guarantee. That's what makes it structured.

Nathaniel J. Smith changed the game back in 2018 when he published
["Notes on structured concurrency, or: Go statement considered harmful."](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/)
(If you haven't read it, you should right now. It's so good!) Its core insight,
which is now widely accepted, is that concurrent tasks, like local variables,
should have their lifetimes aligned with the lexical scope in which they appear.
In other words, every child task lives inside a parent, and the parent does not
exit until every child is accounted for _without exception_.

In Smith's original conception, that means an open scope waits until every child
finishes before closing.

```
// pseudocode
with classic {
  scope.start(taskA)  // runs for 1 second
  scope.start(taskB)  // runs for 2 seconds
  scope.start(taskC)  // runs for 3 seconds
}
// <- doesn't reach here until all three are done (3 seconds)
```

That model is a super-power. It lets us build abstractions with real guarantees
around state and side effects. But if background tasks are allowed to extend the
lifetime of a scope after the foreground is complete, then the model is still
too permissive. The scope stays open for work it no longer justifies, and
correctness becomes a burden shifted upward onto the programmer.

## The strict refinement

Strict structured concurrency adds one more rule to the existing guarantee:
background work does not get to keep a parent alive after the parent's
meaningful computation is done.

What does that mean for `getUserInfo()`? It means the teardown of the spinner
and the timeout disappears from the algorithm:

```js
function* getUserInfo(userId, timeoutMs) {
  yield* spawn(function* () {
    yield* showSpinner({ style: "circle" });
  });

  yield* spawn(function* () {
    yield* sleep(timeoutMs);
    throw new Error("timed out");
  });

  let [user, groups] = yield* all([fetchUser(userId), fetchGroups(userId)]);

  return { ...user, groups };
}
```

The foreground expresses the computation. The background supports it. When the
foreground completes and the scope exits, the background is reclaimed
automatically.

One way to think about it is like the memory that holds local variables in a
stack frame. When a function exits, that memory is reclaimed automatically. You
do not keep it around just because there used to be something interesting in it.
Strict structured concurrency applies the same principle to incidental work. If
the scope is done computing, the support processes do not get to linger.

## The guarantees still hold

Strict structured concurrency is still structured concurrency.

When a background task is shut down automatically, it is not terminated
outright. The parent still waits, just as it would under the standard model, for
every child to run _all_ of its cleanup paths. The result computed by the
foreground is not reported to the caller until that cleanup is complete.

Consider this example that starts a background task and then promptly finishes:

```js
import { main, sleep, spawn } from "effection";

await main(function* () {
  yield* spawn(function* () {
    try {
      yield* sleep(2000);
    } finally {
      yield* sleep(500);
      console.log("cleanup complete");
    }
  });

  console.log("done");
});
```

This prints `done` immediately, waits 500 milliseconds, and then prints
`cleanup complete` before exiting. Upon scope exit, the background task is
halted and its `finally {}` block still must run. Strictness does not weaken the
guarantee. It tightens it around the correct lifetime boundary.

## Focus on what computes

The deepest consequence of strict structured concurrency is not that the code is
cleaner, though it is. It is that the lifetime rules are more correct.

Foreground work remains in the foreground. Background work is allowed to be what
it actually is: support work. Once the computation is complete, the support work
no longer has structural standing to keep the scope alive.

And if a concurrent operation computes, but there is no one left to consume its
result, should it exist? Under strict structured concurrency, the answer is no.
