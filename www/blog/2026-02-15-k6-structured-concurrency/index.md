---
title: "The missing structured concurrency guarantees in k6's JavaScript runtime"
description: "Why groups/tags, errors, and cleanup drift across async boundaries in k6 scripts, and how @effectionx/k6 demonstrates a structured fix."
author: "Taras Mankovski"
tags: ["structured concurrency", "k6", "load testing"]
image: "k6-structured-concurrency.svg"
---

If you've written k6 scripts with async calls, you've probably experienced
metrics not getting tagged inside of `group()` because of async or `.then()`.

This happens because JavaScript treats sync and async differently. What you
expect to work with sync `group()` doesn't work once async gets introduced.

This post is about using structured concurrency to align k6's JavaScript runtime
with your expectations.

The diagram at the top shows what goes wrong. Async deforms your call stack.
Some code runs on the stack you are in now, and some code runs on a new stack on
a future tick. k6 reads the current tags from the sync stack. You expect the tag
values in the async callback to be the same, but by the time that callback runs
it's too late: `group()` has already unwound and restored them.

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
that started it, and state like tags can drift. Other ecosystems hit the same
wall: Python added `TaskGroup` in 3.11, and Kotlin, Swift, and Java now ship
structured concurrency with parent-child lifetime guarantees.

## Universal solution: structured concurrency

Structured concurrency binds all sync and async operations to the same stack and
provides two guarantees that eliminate large categories of async problems:

1. No operation runs longer than its parent.
2. Every operation runs its cleanup.

These are the same constraints we expect from sync code, applied consistently to
both sync and async.

The rest of this post shows what it looks like when these problems are fixed
with structured concurrency using Effection, and what's missing from Sobek to
make it work in k6.

## What it looks like

There are many ways async can drift outside its scope — `.then()` callbacks,
`setTimeout`, WebSocket handlers, and more. The
[`@effectionx/k6` test suite](https://github.com/thefrontside/effectionx/tree/feat/effectionx-k6-preview/k6/tests)
covers these cases. Here's one common example.

Both `c.add(1)` calls are inside `group("coolgroup", ...)`, so you'd expect both
to be tagged. But the second one runs in a `.then()` callback — by then,
`group()` has already finished and removed the tag:

```js
import { group } from "k6";
import http from "k6/http";
import { Counter } from "k6/metrics";

const c = new Counter("my_counter");

export default function () {
  group("coolgroup", () => {
    c.add(1); // tagged with group=coolgroup

    http.asyncRequest("GET", "https://test.k6.io").then(() => {
      c.add(1); // NOT tagged (runs after group() restored tags)
    });
  });
}
```

And here is the same scenario with `@effectionx/k6`:

```js
import { group, main } from "@effectionx/k6";
import { until } from "effection";
import http from "k6/http";
import { Counter } from "k6/metrics";

const c = new Counter("my_counter");

export default main(function* () {
  yield* group("coolgroup", function* () {
    c.add(1); // tagged with group=coolgroup

    yield* until(http.asyncRequest("GET", "https://test.k6.io"));
    c.add(1); // still tagged
  });
});
```

The group scope owns the async work the same way it owns sync work. Lifetime is
structural, not incidental. Work started in scope stays in scope.

Async should just feel normal.

## Why Effection for k6?

Effection is a structured concurrency library for JavaScript, designed as a
polyfill until the language adopts these semantics natively. It's tiny (<5k
gzipped), mature (used in production since 2019), and easy to drop in and
experiment with. If you know `async/await`, the translation is mostly mechanical:
`async function` becomes `function*`, `await` becomes `yield*`. The Effection
docs include a [Rosetta Stone](https://frontside.com/effection/docs/rosetta-stone)
that maps common async patterns to their structured equivalents.

Every framework that handles concurrent work eventually faces this choice:
keep patching async edge cases one by one, or adopt a model that eliminates the
category of problems. Kotlin, Swift, Python, and Java all chose structured
concurrency. JavaScript doesn't have it built in yet, and TC39 isn't close.
Effection's goal is to make this choice easy and safe until these guarantees are
added to the JavaScript runtime. Its low learning curve and small footprint make
it a good candidate for k6 scripts. It can be adopted incrementally — one script
at a time — without requiring any changes to Sobek beyond ECMAScript compliance.

## What k6 needs: Sobek PR #115

To make structured cleanup work, `generator.return()` must execute `finally`
blocks correctly. This is specified in ECMAScript — when `return()` is called on
a generator suspended in a `try` block with a `finally`, the `finally` must run.

Sobek had a gap here: during `return()`, yields inside `finally` were skipped.
That breaks structured cleanup because "exit fully" stops being true at exactly
the point where cleanup needs to happen.

[Sobek PR #115](https://github.com/grafana/sobek/pull/115) fixes that behavior.
This is ECMAScript conformance work, not a feature request. The runtime is
aligning with the language contract.

[effectionx PR #156](https://github.com/thefrontside/effectionx/pull/156)
includes a conformance suite that locks these semantics as integration evolves.

## Try it

```bash
npm install @effectionx/k6 effection
```

Take one existing script that uses `group()` with any promise boundary. Replace
`export default function () {}` with `export default main(function* () {})`,
wrap the async path in `yield* group(...)`, and replace `.then()` chains with
`yield* until(...)`.

If you maintain k6 or Sobek, please review the PRs and the conformance cases.
The runtime boundary is where this guarantee has to hold, or it will leak
everywhere above it.

When the invariant holds, async stops lying.
