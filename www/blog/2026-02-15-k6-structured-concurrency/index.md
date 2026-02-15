---
title: "The missing structured concurrency guarantees in k6's JavaScript runtime"
description: "Why groups/tags, errors, and cleanup drift across async boundaries in k6 scripts, and how @effectionx/k6 demonstrates a structured fix."
author: "Taras Mankovski"
tags: ["structured concurrency", "k6", "load testing"]
image: "k6-structured-concurrency.svg"
---

If you've written k6 scripts with async calls, you've probably seen this: a
metric is "inside" a `group()`, but it doesn't get tagged with that group once a
`.then()` or promise callback gets involved.

That's a missing guarantee in the JavaScript runtime.

## Why `group()` can't fix this on its own

k6's `group()` behaves like a `try/finally`-scoped tag mutation: set a tag,
execute a callback, restore the old tag. In
[#2728](https://github.com/grafana/k6/issues/2728), @mstoykov describes why
`.then()` breaks that model:

> "As the `then` callbacks get called only after the stack is empty the whole
> `group` code would have been executed, resetting the group back to the root
> name (which is empty)."

The callback is scheduled after the current stack unwinds, so the `finally` has
already restored the old group. That same thread captures why an
`async/await`-only fix isn't enough: `.then()` chains and callback-based APIs
(like the experimental websocket) still leave you with inconsistent tagging and
unclear definitions of what a "group" should wait for.

## The missing guarantees

Structured concurrency provides two guarantees:

1. No operation runs longer than its parent.
2. Every operation exits fully (cleanup runs).

k6's CLI is written in Go, but k6 scripts run inside an embedded JavaScript
runtime (Sobek). When you cross async boundaries, k6 has to decide what context
applies, how errors surface, and what gets cleaned up on shutdown. Today, that
model is mostly "whatever happens to be on the call stack."

The absence of these guarantees explains a category of problems that have
accumulated in k6 over years:

### Context loss

Grouped metrics drift out of the group that logically owns them.

- [#2728](https://github.com/grafana/k6/issues/2728) — `group` doesn't work with
  async calls well
- [#2848](https://github.com/grafana/k6/issues/2848) — Change how `group()`
  calls async functions

### Resource leaks

Open sockets, timers, and background work survive longer than the scenario that
created them.

- [#4241](https://github.com/grafana/k6/issues/4241) — Goroutine leaks in
  browser module
- [#785](https://github.com/grafana/k6/issues/785) — Per-VU init lifecycle
  function (open since 2018)
- [#5382](https://github.com/grafana/k6/issues/5382) — VU-level lifecycle hooks

### Silent failures

Failures in background async paths get lost or surface too late.

- [#5249](https://github.com/grafana/k6/issues/5249) — Unhandled promise
  rejections don't fail tests
- [#5524](https://github.com/grafana/k6/issues/5524) — WebSocket handlers lose
  async results

### Unpredictable shutdown

- [#2804](https://github.com/grafana/k6/issues/2804) — Unified shutdown behavior
  (lists 8 different ways to stop k6, none consistent)
- [#3718](https://github.com/grafana/k6/issues/3718) — Graceful interruptions

### Race conditions

- [#4203](https://github.com/grafana/k6/issues/4203) — Race condition on
  emitting metrics
- [#5534](https://github.com/grafana/k6/issues/5534) — Data race during panic
  and event loop
- [#3747](https://github.com/grafana/k6/issues/3747) — panic: send on closed
  channel

## What structured ownership looks like

`@effectionx/k6` demonstrates what changes when scope owns async work.

Here's the `group()` problem from #2728:

```js
// BEFORE: group context lost across async
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

```js
// AFTER: @effectionx/k6 preserves context
import { group, main } from "@effectionx/k6";
import { call } from "effection";
import { Counter } from "k6/metrics";

const delay = () => Promise.resolve();
const c = new Counter("my_counter");

export default main(function* () {
  yield* group("coolgroup", function* () {
    c.add(1); // tagged with group=coolgroup

    // The group scope owns this async work.
    // When the scope exits, child work is canceled.
    yield* call(delay);
    c.add(1); // still tagged
  });
});
```

The group scope owns the async work. The parent doesn't decide when the child is
done, but it does decide when the child is no longer relevant. When the scope
exits, cleanup runs.

Effection's design goal is simple: async should just feel normal.

## The runtime dependency: ECMAScript conformance and Sobek PR #115

Structured cleanup requires `generator.return()` to unwind through `finally`
blocks reliably. This behavior is specified in ECMAScript
([§27.5.3.4 GeneratorResumeAbrupt](https://tc39.es/ecma262/#sec-generatorresumeabrupt)):
when `return()` is called on a generator suspended in a `try` block with a
`finally`, the `finally` must execute. If the `finally` contains a `yield`, the
generator suspends there. Subsequent `next()` calls resume the `finally` until
it completes.

Sobek had a gap here: it was skipping yields in `finally` blocks during
`return()`, immediately marking the generator as done. This breaks structured
cleanup, because cleanup often needs to perform async work (which requires
yielding).

[Sobek PR #115](https://github.com/grafana/sobek/pull/115) fixes this specific
behavior. The k6/Sobek project prioritizes ECMAScript conformance, so this isn't
a feature request—it's a spec compliance fix that aligns Sobek with V8,
SpiderMonkey, and JavaScriptCore.

## What the conformance suite tests

The adapter work in
[effectionx PR #156](https://github.com/thefrontside/effectionx/pull/156)
includes a conformance suite designed to determine what primitives Sobek already
supports and where the gaps are.

**What Sobek already supports:**

- Symbols
- Generators (creation, iteration, `yield`)
- Yield delegation (`yield*`)
- `throw()` into generators
- Promises and microtask scheduling
- Timers (`setTimeout`, etc.)
- `AbortController` / `AbortSignal`

**What was missing:**

- Async cleanup via `generator.return()` + `finally` blocks (fixed by PR #115)

The `05-yield-return.ts` tests specifically verify the `finally` + `yield`
behavior. The k6 adapter tests then build on these primitives to verify:

- Child work is canceled when parent scope exits
- Cleanup runs on cancellation paths
- Errors propagate through owned task trees
- Shutdown ordering is deterministic under interruption

Most of what Effection needs was already in Sobek. The one missing piece—async
cleanup during generator return—is what PR #115 addresses.

## Try it

```bash
npm install @effectionx/k6 effection
```

Replace one scenario entrypoint with `main(function* () { ... })`, wrap one
problematic flow in a scoped operation, and run your normal `k6 run` command.

If child lifetime escapes parent lifetime, file it with a minimal repro. That's
the invariant that matters.

If you maintain k6 or Sobek, please review
[Sobek PR #115](https://github.com/grafana/sobek/pull/115) and
[effectionx PR #156](https://github.com/thefrontside/effectionx/pull/156).

When the invariant holds, async starts to feel like normal control flow again.
