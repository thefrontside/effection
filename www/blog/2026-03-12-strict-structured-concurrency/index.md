---
title: "What is Strict Structured Concurrency?"
description: "Effection applies a refined version of structured concurrency where background tasks are automatically reclaimed when their scope exits. The result is code that focuses on the algorithm, not on cleanup."
author: "Charles Lowell"
image: strict-structured-concurrency.svg
---

People who come to [Effection](https://frontside.com/effection) for the first
time, even those who are already familiar with structured concurrency, are often
surprised by how aggressively it tears down child tasks. They'll spawn a few
concurrent operations, return from the parent, and discover that every single
child has been _cancelled_. Not joined. Not awaited. Cancelled.

```jsx
import { run, sleep, spawn } from "effection";

await run(function* () {
  yield* spawn(function*(){
	  yield* sleep(1000);
	  console.log('one second');
  );

  yield* spawn(function*(){
	  yield* sleep(2000);
	  console.log('two seconds');
  );

  console.log("done");
});
```

This program prints `done` and exits right away. Both sleepers? Gone. If you're
coming from a structured concurrency background like Python or Swift, this might
feel wrong. In those systems, a parent scope waits for all of its children to
complete before it exits. That's _the_ guarantee. That's what makes it
structured. So what is Effection doing here?

The answer is that Effection is applying a refined version of structured
concurrency; one that imposes more rigid constraints on the lifetime of each
task. We arrived at this behavior after years of iteration, and we call it
**strict structured concurrency.**

## Structured concurrency as we know it

Nathaniel J. Smith changed the game back in 2018 when he
published ["Notes on structured concurrency, or: Go statement considered harmful."](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/)
(If you haven’t read it, then you should right now. It’s so good!) Its core
insight, which is now widely accepted, is that concurrent tasks, like local
variables, should have their lifetimes aligned with the lexical scope in which
they appear. In other words, every child task lives inside a parent, and the
parent does not exit until every child is accounted for _without exception_.

_This_ is the guarantee that defines structured concurrency. But what does it
mean in practice?

In Smith’s original conception, it means that when an open scope has tasks
spawned into it, it will wait until every task is finished before closing.

```
// pseudocode
with classic {
  scope.start(taskA)  // runs for 1 second
  scope.start(taskB)  // runs for 2 seconds
  scope.start(taskC)  // runs for 3 seconds
}
// ← doesn't reach here until all three are done (3 seconds)
```

Control flows in the top, stuff happens, control flows out the bottom, but in
all cases the ledger of concurrent tasks is exactly the same as when it entered.
This simple constraint is a straight up super-power because it allows us to
build and compose abstractions that can nevertheless contain all kinds of
side-effects and state. The safety is real.

## The cancellation tax

But what happens when you want to leave a scope _before_ its children are done?

Under the standard model, it’s roll your own. The scope implicitly holds the
door open until everyone finishes, so if you want an early exit, you need to
reach for a cancellation mechanism to wind down the children yourself. Each
system is different (In Effection, you generally use `Task.halt()`)

For example, this code shows a spinner while downloading and returning user
information.

```jsx
function* getUserInfo(userId) {
  let spinner = yield* spawn(function* () {
    yield* showSpinner({ style: "circle" });
  });

  let [user, groups] = yield* all([fetchUser(userId), fetchGroups(userId)]);

  yield* spinner.halt();

  return { ...user, groups };
}
```

To recap, this code:

1. shows the spinner
2. grabs the user info
3. halts the spinner
4. return the user info

This works, and it is safe, and it is correct. But in practice, we found that we
were having to explicitly manage the lifetime of tasks like the spinner
_constantly_.

Imagine we extended our operation by adding a timeout.

```jsx
function* getUserInfo(userId, timeoutMs) {
  let spinner = yield* spawn(function* () {
    yield* showSpinner({ style: "circle" });
  });

  let timeout = yield* spawn(function* () {
    yield* sleep(timeoutMS);
    throw new Error("timed out");
  });

  let [user, groups] = yield* all([fetchUser(userId), fetchGroups(userId)]);

  yield* spinner.halt();
  yield* timeout.halt();

  return { ...user, groups };
}
```

This begins the countdown right after the spinner. Then, right before we’re
ready to return, just as with the spinner, we tear it down.

Additions like this kept happening over and over again. From maintaining a “keep
alive” heartbeat on a web socket, to periodically flushing OTEL metrics, the
pattern that began to emerge was that there were actually two types of tasks:
one whose lifecycle always seemed to just work itself out, and another that
always had to be managed.

## Foreground and background

The tasks whose lifecycles "just worked out" were the ones
whose values represented the heart of the computation. In the example above, to
return a combination of `fetchUsers()` and `fetchGroups()` is the _literal
definition_ of what it means to `getUserInfo()`. They are the pure components
used to express the scope’s algorithm which is why we call them **foreground**
tasks.

Then there are the other tasks: the spinner, the timeout, the heartbeat. These
don’t participate in the algorithm, and they don't produce a value that the
scope consumes. Instead they are there to produce a
persistent _side-effect_ that supports the foreground while it runs. That’s what
makes them **background** tasks.

Stated more formally, a foreground task is one whose result is explicitly
consumed by the foreground, whereas a background task is one whose result is
_never_ consumed by the foreground.

To see this difference in action, let’s take our original example, but instead
of consuming the user info directly, let’s start by spawning the fetch in a
background task first.

```jsx
function* getUserInfo(userId) {
  let spinner = yield* spawn(function* () {
    yield* showSpinner({ style: "circle" });
  });

  let info = yield* spawn(function* () {
    return yield* all([fetchUser(userId), fetchGroups(userId)]);
  });

  // both `spinner` and `info` are now running in the background.

  let [user, groups] = yield* info; // ← `info` is "pulled" into forgeground

  // only `spinner` remains in the background... shut it down
  yield* spinner.halt();

  return { ...user, groups };
}
```

Notice how there is no need to manage the lifecycle of the `info` task. It just
happened naturally because the foreground requires the values of `user` and
`groups` in order compute its return value. In other words, the `info` task
_must_ be completed by the time we get to the end of the function. If it
weren’t, then we wouldn’t be at the end of the function, now would we? As a
result, the lifetime of a foreground task is always naturally aligned with the
lifetime of its scope.

On the other hand, the lifetime of a background task is _not_ naturally aligned
with the lifetime of its scope. A background task’s natural lifetime can be
long. It can be short. Quite often it is _infinite_. But whatever the case, what
sets it apart from the foreground is that once its scope completes, it has no
further reason to exist.

A spinner whose downloads are complete? A heartbeat nobody is listening for? A
collector with no more metrics to flush? These aren't tasks that need to be
“managed.” These are tasks that just need to _go away_.

Under the standard model, background tasks hold the scope open just like
foreground tasks do, which means that the _programmer_ is required to explicitly
manage the lifecycle of each and every task in the background. That's the
cancellation tax. It's a tax on your algorithm paid in the form of the stuff
that isn’t in it.

## The “strict” refinement

Strict structured concurrency, the kind built into Effection, adds a new
constraint to the existing guarantee: **a child may not outlive its
parent.** When a scope reaches its end, anything remaining in the background is
instructed to immediately shut down.

What does this mean for our `getUserInfo` example? It means the teardown of the
spinner and the timeout just disappear from the code:

```jsx
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

The foreground expresses the algorithm, and the background is spun up to support
it. When the foreground completes and its scope exits, the background, which is
no longer needed, is automatically reclaimed. What's left is just the code that
matters.

One way to think about it is like the memory resources that hold variable
references in a function’s stack frame. When a function exits, those memory
resources are automatically recycled. You don’t have to deallocate them
explicitly, you don’t even have to think about them because the lifetime of the
memory is tied to the function’s scope. Strict structured concurrency does the
same thing for tasks. The background tasks are automatically reclaimed when the
foreground moves on, so that it's one less thing you carry.

## The guarantees still hold

Strict structured concurrency is still structured concurrency.

When a background task is shut down automatically, it is not terminated
outright. The parent still waits, just as it would under the standard model, for
every child to run _all_ of its cleanup paths. The result computed by the
foreground will not be reported to the caller until they are complete.

Consider this example that starts a task running in the background, and then
promptly finishes.

```jsx
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

This will print `“done”` immediately, wait 500 milliseconds, and then print
"cleanup complete" before exiting. This is because upon exit, the background
task will be halted and its `finally {}` block must be run. The strict
refinement doesn't weaken the guarantee. It just makes it more intuitive by
making orderly shutdown the _default_ rather than something you have to arrange
by hand.

## Focus on the algorithm

However the deepest consequence of the strict variant of structured concurrency
is where it focuses attention. The foreground is in the foreground. The
background is just allowed to _be_ the background. And the structure of your
program guarantees that the latter will gracefully disappear once the former is
complete.

Perhaps a more philosophical way to put it: if a concurrent operation computes,
but there is no one there to consume its result, does it exist? Under strict
structured concurrency, the answer is no. And the code you would have written to
make it stop? That doesn't need to exist either.
