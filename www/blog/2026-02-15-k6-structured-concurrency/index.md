---
title: "The missing structured concurrency guarantees in k6's JavaScript runtime"
description: "Why groups/tags, errors, and cleanup drift across async boundaries in k6 scripts, and how @effectionx/k6 demonstrates a structured fix."
author: "Taras Mankovski"
tags: ["structured concurrency", "k6", "load testing"]
image: "k6-structured-concurrency.svg"
---

You have probably seen this one already: a metric increment that should be under
`group()` shows up untagged. The script looks correct. The output does not.
Nothing is obviously broken, but your context drifted across an async boundary
and your data is now lying to you.

This post explains why that happens, why it is bigger than `group()`, and what
it looks like when the runtime gives you the missing lifetime guarantees.

## `group()` is just the tip of the iceberg

At a high level, `group()` does three synchronous things: set the current group
tag, run your callback, restore the previous tag. That works for synchronous
code because the callback finishes before control returns.

Promises do not work that way. If you schedule `.then()`, that callback runs
later, after the current stack is empty. By then, `group()` has already restored
tags.

As @mstoykov put it in [#2728](https://github.com/grafana/k6/issues/2728):

> "As the `then` callbacks get called only after the stack is empty the whole
> `group` code would have been executed, resetting the group back to the root
> name (which is empty)."

Maintainers explored making `group()` "wait" for async work. It sounds simple
until you hit the corner cases: which promises count, how far transitive waiting
goes, what to do with detached callbacks, what to do with timers, what to do
with user abstractions built on top of all of that. You patch one path, another
leaks.

This is not a k6-specific bug; it is what unstructured async does. Once work can
be scheduled to run later—callbacks, promises, futures—it can outlive the task
that started it, and context like tags drifts. Other ecosystems hit the same
wall: Python added `TaskGroup` in 3.11, and Kotlin, Swift, and Java now ship
structured concurrency with parent-child lifetime guarantees.

## The common solution: structured concurrency

Structured concurrency gives two guarantees:

1. No operation runs longer than its parent.
2. Every operation exits fully.

Those two constraints sound strict because they are strict. They are also
exactly what keeps context, errors, and cleanup coherent.

k6 scripts run in Sobek, an embedded JavaScript runtime. If Sobek enforces
structured lifetime semantics, k6 gets the same guarantees at script level: work
cannot outlive scope, and scope exit means real exit, including cleanup. The
long tail of async drift problems (tags, teardown, propagated failures,
cancellation behavior) collapses into one model instead of many local fixes.

## What it looks like

Here is the drift in plain code:

```js
import { Counter } from "k6/metrics";
import { group } from "k6";

const delay = () => Promise.resolve();
const c = new Counter("my_counter");

export default function () {
  group("coolgroup", () => {
    c.add(1); // tagged with group=coolgroup

    delay().then(() => {
      c.add(1); // NOT tagged (runs after group() restored tags)
    });
  });
}
```

And here is the same scenario with `@effectionx/k6`:

```js
import { group, main } from "@effectionx/k6";
import { call } from "effection";
import { Counter } from "k6/metrics";

const delay = () => Promise.resolve();
const c = new Counter("my_counter");

export default main(function* () {
  yield* group("coolgroup", function* () {
    c.add(1); // tagged with group=coolgroup

    yield* call(delay);
    c.add(1); // still tagged
  });
});
```

The group scope owns the async work the same way it owns sync work. Lifetime is
structural, not incidental. Work started in scope stays in scope.

Async should just feel normal.

## What k6 needs: Sobek PR #115

To make this correct, cleanup must run during structured cancellation and
unwind. In JavaScript terms, `generator.return()` must execute `finally` blocks
correctly.

Sobek had a gap here: during `return`, yields inside `finally` were skipped.
That breaks structured cleanup because "exit fully" stops being true at exactly
the point where cleanup needs to happen.

[Sobek PR #115](https://github.com/grafana/sobek/pull/115) fixes that behavior.
This is ECMAScript conformance work, not a feature request. The runtime is
aligning with the language contract.

There is also [effectionx PR #156](https://github.com/thefrontside/effectionx/pull/156),
which includes a conformance suite around these semantics so behavior stays
locked as integration evolves.

## Try it

Install the package:

```bash
npm install @effectionx/k6 effection
```

Take one existing script that uses `group()` with any promise boundary, convert
`export default function () {}` to `export default main(function* () {})`, then
move that path under `yield* group(...)` and replace promise bridging with
`yield* call(...)`.

If you maintain k6 or Sobek, please review the PRs and the conformance cases.
The runtime boundary is where this guarantee has to hold, or it will leak
everywhere above it.

When the invariant holds, async stops lying.
