---
title: "The missing structured concurrency guarantees in k6's JavaScript runtime"
description: "Why groups/tags, errors, and cleanup drift across async boundaries in k6 scripts, and how @effectionx/k6 proves a structured fix."
author: "Taras Mankovski"
tags: ["structured concurrency", "k6", "load testing"]
image: "k6-structured-concurrency.svg"
---

If you've written non-trivial k6 scripts, you've probably seen some version of
this: the code is "inside" a `group()`, but the metric/check isn't tagged with
that group once an async boundary gets involved.

That's not user error. It's a missing guarantee in the JavaScript runtime.

Structured concurrency gives us the missing rule: a child cannot outlive its
parent. The parent does not decide when the child is done, but it does decide
when the child is no longer relevant. That distinction is the whole game.

k6's CLI is written in Go, but k6 scripts run inside an embedded JavaScript
runtime (Sobek). When you cross async boundaries there, k6 has to decide what
context (groups/tags) applies, how errors surface, and what gets cleaned up on
shutdown. Today, that model is mostly "whatever happens to be on the call
stack".

The maintainers have explained this in detail in
[#2728](https://github.com/grafana/k6/issues/2728) and why trying to "just make
`group()` async" quickly becomes inconsistent and surprising
([oleiade's take](https://github.com/grafana/k6/issues/2728#issuecomment-1286933495),
[mstoykov's conclusion](https://github.com/grafana/k6/issues/2728#issuecomment-1404747660)).

This post is a case study: the category of problems k6 has been running into for
years, and a small package (`@effectionx/k6`) that demonstrates a structured fix
today.

## The pain in five categories

### 1) Context loss

The visible symptom is grouped metrics drifting out of the group that logically
owns them.

- [#2728](https://github.com/grafana/k6/issues/2728) — `group` doesn't work with
  async calls well
- [#2848](https://github.com/grafana/k6/issues/2848) — Change how `group()`
  calls async functions

The important part isn't whether `group()` accepts an `async function`. It's
that `group()` is implemented like a `try/finally`-scoped tag mutation, so the
tag only applies to the current synchronous call stack. Promise jobs and
callback-based APIs run later, after the `finally` has already restored the old
tags.

### 2) Resource leaks

Open sockets, timers, and long-lived background work survive longer than the
scenario that created them.

- [#4241](https://github.com/grafana/k6/issues/4241) — Goroutine leaks in
  browser module
- [#785](https://github.com/grafana/k6/issues/785) — Per-VU init lifecycle
  function (open since 2018)
- [#5382](https://github.com/grafana/k6/issues/5382) — VU-level lifecycle hooks

This is classic unowned lifetime. You can start work easily, but there is no
parent scope that must reclaim it on cancellation or exit.

### 3) Silent failures

Failures in background async paths get lost or reported too late to be
actionable.

- [#5249](https://github.com/grafana/k6/issues/5249) — Unhandled promise
  rejections don't fail tests
- [#5524](https://github.com/grafana/k6/issues/5524) — WebSocket handlers lose
  async results

When async branches are detached, error propagation becomes accidental.

### 4) Unpredictable shutdown

- [#2804](https://github.com/grafana/k6/issues/2804) — Unified shutdown behavior
  (lists 8 different ways to stop k6, none consistent)
- [#3718](https://github.com/grafana/k6/issues/3718) — Graceful interruptions

If shutdown is "best effort" instead of scope-driven, you get races between
in-flight work, teardown, and runtime exit.

### 5) Race conditions

- [#4203](https://github.com/grafana/k6/issues/4203) — Race condition on
  emitting metrics
- [#5534](https://github.com/grafana/k6/issues/5534) — Data race during panic
  and event loop
- [#3747](https://github.com/grafana/k6/issues/3747) — panic: send on closed
  channel

These are what happens when composition exists without lifetime ownership.

## Before and after

Here's group context drift — the most common complaint:

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

    // Express the async boundary as part of the structured flow.
    // The group owns the lifetime of the work, so context is preserved.
    yield* call(delay);
    c.add(1); // still tagged
  });
});
```

The group owns the lifetime of the work inside it. If the group scope ends, the
child work is canceled with it.

## The runtime fix

This work depends on k6's JavaScript runtime (Sobek) honoring generator
cancellation correctly. Specifically, `generator.return()` has to unwind
reliably so `finally` blocks run when scopes are canceled.

[Sobek PR #115](https://github.com/grafana/sobek/pull/115) closes that
correctness gap. Without it, guarantees become "usually." With it, cleanup and
unwind semantics are dependable enough to build on.

## Conformance suite: evidence, not vibes

The adapter work in
[effectionx PR #156](https://github.com/thefrontside/effectionx/pull/156)
includes a conformance suite that asserts the guarantees directly:

- child work is canceled when parent scope exits
- cleanup runs on cancellation paths
- errors propagate through owned task trees
- shutdown ordering is deterministic under interruption

This is the difference between a library API that looks structured and one that
is actually structured.

## Try it

```bash
npm install @effectionx/k6 effection
```

Replace one scenario entrypoint with `main(function* () { ... })`, wrap one
problematic flow in a scoped operation, and run your normal `k6 run` command.

If you find a case where child lifetime escapes parent lifetime, file it with a
minimal repro. That is the invariant that matters.

If you maintain k6 or Sobek, please review
[Sobek PR #115](https://github.com/grafana/sobek/pull/115) and
[effectionx PR #156](https://github.com/thefrontside/effectionx/pull/156).

When the invariant holds, async starts to feel like normal control flow again.
