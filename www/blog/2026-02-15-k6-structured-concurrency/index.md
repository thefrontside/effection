---
title: "Structured Concurrency for k6, With Receipts"
description: "k6 has 20+ open issues caused by one missing model. We built @effectionx/k6 to prove structured concurrency solves them."
author: "Taras Mankovski"
tags: ["structured concurrency", "k6", "load testing"]
image: "k6-structured-concurrency.svg"
---

The bug report starts the same way. You hit Ctrl-C, and the process still has
work running. Or a request executes after the code that created its context is
already gone. Or the run exits "cleanly" while a failure was swallowed in
background work.

That is not one bug. That is one missing model.

Structured concurrency gives us the missing rule: a child cannot outlive its
parent. The parent does not decide when the child is done, but it does decide
when the child is no longer relevant. That distinction is the whole game.

k6 sits right in the pain because it orchestrates real async work inside a
runtime that historically exposed promises and callbacks without lifetime
ownership. I went looking for the receipts — the actual issue reports — and
found over twenty open issues that trace back to this gap.

## The pain in five categories

### 1) Context loss

The visible symptom is grouped metrics drifting out of the group that logically
owns them.

- [#2728](https://github.com/grafana/k6/issues/2728) — `group` doesn't work with
  async calls well
- [#2848](https://github.com/grafana/k6/issues/2848) — Change how `group()`
  calls async functions

The k6 team decided NOT to support async functions in `group()` because of
corner cases. From #2728: "After even more discussion it was decided to _not_
support async functions in `group` and `check` at this time."

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
group("checkout", async () => {
  let res = await http.asyncRequest("GET", url);
  check(res, { "status 200": (r) => r.status === 200 });
  // check is NOT tagged with "checkout" — context escaped
});
```

```js
// AFTER: @effectionx/k6 preserves context
import { group, main } from "@effectionx/k6";
import { call } from "effection";

export default main(function* () {
  yield* group("checkout", function* () {
    let res = yield* call(() => http.asyncRequest("GET", url));
    check(res, { "status 200": (r) => r.status === 200 });
    // check IS tagged — context is scope-owned
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
