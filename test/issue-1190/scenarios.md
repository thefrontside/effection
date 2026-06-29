# Issue 1190 Halt Propagation Scenarios

This is an investigation checklist for
https://github.com/thefrontside/effection/issues/1190. The goal is to
characterize where halt propagation leaks past a `yield*`-delegated operation
whose `finally` performs asynchronous work, and where Effection-owned boundaries
already prevent that resurrection.

## Core Delegation Cases

1. Plain `yield* child()`; child halts inside `try`; child `finally` is
   synchronous; parent has a statement after `yield*`. (Known-good; = scenario
   52.)
2. Plain `yield* child()`; child `finally` does `yield* sleep(0)`; parent has a
   statement after `yield*`. (Core known-bug; = scenarios 16, 32, 53.)
3. Same as 2, but parent has another `yield* sleep(0)` after the leaked
   statement.
4. Same as 2, but parent wraps post-child code in `try/catch`.
5. Same as 2, but parent wraps post-child code in `try/finally`.
6. Same as 2, but parent itself has an outer `finally`.
7. Same as 2, but child returns a value from `finally`. (A `return` in a
   `finally` overrides the in-flight halt-return per JS completion semantics —
   characterize whether it suppresses the `"halted"` outcome.)
8. Same as 2, but child throws from `finally`.
9. Same as 2, but child `finally` yields twice before completing.
10. Removed as redundant with scenario 2: post-yield synchronous cleanup is
    already represented by the event pushed after `yield* sleep(0)`.

## Nested Delegation Depth

11. Parent `yield* middle()`; middle `yield* child()`; child async `finally`;
    parent has post-delegation code.
12. Parent to middle to child, where middle also has async `finally`.
13. Parent to middle to child, where child has async `finally`, middle has
    synchronous `finally`.
14. Removed as redundant with scenario 13: the middle continuation after
    `yield* child()` is already observed there.
15. Parent to middle to child, where both middle and parent have code after
    delegation.

## Different Suspension Points In Finally

16. Child `finally` uses `yield* sleep(0)`. (= scenario 2.)
17. Child `finally` uses `yield* until(Promise.resolve())`.
18. Child `finally` uses `yield* action(...)`.
19. Child `finally` uses `yield* suspend()` (no external release exists —
    `suspend()` only completes when its scope is destroyed; characterize whether
    cleanup deadlocks during halt).
20. Child `finally` uses `yield* resource(...)`.
21. Child `finally` uses `yield* scoped(...)`.
22. Child `finally` uses `yield* spawn(...)` and waits for the task.
23. Child `finally` uses `yield* task.halt()`.

## Halt Initiators

24. External `await task.halt()` while child is suspended.
25. Parent scope exits normally while a _spawned_ child is suspended. (Must be a
    spawned/sibling child — a `yield*`-delegated parent is blocked inside the
    `yield*` and cannot exit on its own.)
26. Parent scope exits by throwing while a _spawned_ child is suspended. (Same
    spawned-child caveat as 25.)
27. Sibling task errors, causing this task to halt.
28. `race()` loser is halted while inside delegated async `finally`.
29. `all()` member errors, causing sibling halt during async `finally`.
30. `scoped()` exits and halts child work during async teardown.
31. `createScope().destroy()` halts task during delegated async `finally`.

## Effection Boundary Comparisons

> Desired behavior: Effection-owned boundaries should not leak post-halt user
> code. Use the `scoped()` cases (21, 30, 34) to characterize current behavior
> against that target.

32. Plain `yield* child()` leaks or not. (= core known-bug, scenario 2/53.)
33. `yield* call(child)` leaks or not.
34. `yield* scoped(child)` leaks or not. Desired behavior: no leak after the
    halted child completes its async cleanup.
35. `yield* spawn(child)` then halt spawned task.
36. `scope.run(child)` then `task.halt()`.
37. `resource()` body has async `finally`; caller exits.
38. `ensure()` cleanup operation yields during halt.
39. `all([child])` halted externally.
40. `race([child, winner])` halts child as loser.

## Post-Halt Observable Behavior

41. Code immediately after halted delegation runs.
42. A second `yield*` after halted delegation runs.
43. Parent `catch` incorrectly catches or resumes.
44. Parent `finally` runs exactly once.
45. Child cleanup after async yield completes.
46. The task promise (awaiting the task itself) rejects with `"halted"` —
    whereas `task.halt()` resolves (see 47).
47. `task.halt()` resolves only after cleanup completes.
48. No user code after the halted boundary runs.
49. Background errors during async cleanup win over `"halted"` when expected.
50. Cleanup error from child `finally` propagates through `halt()`.

## Useful Characterization Buckets

51. Known-good: inline async `finally` in the same generator.
52. Known-good: delegated child with synchronous `finally`.
53. Known-bug: delegated child with async `finally` and parent code after
    `yield*`. (Currently _uncovered_ by the suite — the closest existing test,
    `test/run.test.ts` "can suspend in yielded finally block", has no statement
    after the `yield*` so it cannot observe the leak.)
54. Boundary-sensitive: same child through `scoped`, `spawn`, `resource`, `all`,
    `race`.
55. Regression guard: async cleanup must finish, but parent must not resurrect.

## Existing Test Cross-Reference

Coverage legend:

- **Exact**: directly exercises the scenario shape.
- **Partial**: covers one relevant property, but not the delegated
  async-`finally` leak shape.
- **Missing**: no current test meaningfully covers it.

### Core Delegation Cases

- Scenarios 2-10: **Missing**. These are the core post-delegation resurrection
  cases: `yield* child()`, child async `finally`, and normal parent code after
  the delegated operation. The closest current test is `test/run.test.ts` "can
  suspend in yielded finally block", but it has no normal statement after the
  delegated `yield*`, so it cannot observe the leak.
- Scenario 1 / 52: **Partial**. `test/run.test.ts` "halts task when halted
  generator" covers delegated synchronous cleanup and the parent's outer
  `finally`, but does not place normal post-`yield*` code after the child.
- Scenario 51: **Exact** for inline async cleanup. `test/run.test.ts` "can
  perform async operations in a finally block" and `test/coroutine.test.ts`
  "uses 'return' for a single iteration when unwound" both verify that async
  cleanup in the same generator completes and does not continue unreachable
  same-frame code.

### Nested Delegation Depth

- Scenarios 11-15: **Missing** for the issue shape. Existing tests cover nested
  scopes and traps, but not multiple native `yield*` generator delegation frames
  where an async child `finally` can resurrect code in middle or parent frames.

### Different Suspension Points In Finally

- Scenario 16: **Partial**. Covered as cleanup completion by `test/run.test.ts`
  "can suspend in yielded finally block", but missing the post-child leak
  assertion.
- Scenario 17: **Missing** for delegated async `finally` with `until()`.
- Scenario 18: **Partial**. `test/run.test.ts` "handles errors in exiting
  suspend points" covers `action()` exit errors during halt, but not `action()`
  as the async suspension inside a delegated child `finally`.
- Scenario 19: **Missing** for delegated child `finally` using `suspend()`.
- Scenario 20: **Partial**. `test/resource.test.ts` "is released in the reverse
  order from which it was acquired" and "task.halt() does not resolve until
  async resource cleanup finishes" cover async resource cleanup ordering and
  halt waiting, but not resource use inside a delegated child `finally`.
- Scenario 21: **Partial**. `test/scoped.test.ts` covers scoped shutdown and the
  desired no-leak boundary behavior in "does not execute code after scoped()
  when halted during async teardown", but not `scoped()` nested inside the child
  `finally`.
- Scenario 22: **Partial**. `test/spawn.test.ts` covers spawned task teardown,
  async halt, and destructor ordering, but not `spawn()` inside the delegated
  child `finally`.
- Scenario 23: **Partial**. `test/run.test.ts` "cannot halt itself" and "cannot
  halt itself between yield points", plus `test/spawn.test.ts` "finishes
  normally when child halts", cover task halt interactions, but not
  `task.halt()` inside the delegated child `finally`.

### Halt Initiators

- Scenario 24: **Partial**. Many `test/run.test.ts` cases use external
  `task.halt()`, including "can halt generator", "halts task when halted
  generator", and "can suspend in yielded finally block"; none assert normal
  post-delegation code does not run after async child cleanup.
- Scenarios 25-26: **Partial**. `test/spawn.test.ts` "halts child when finishing
  normally" and "halts child when errored" cover spawned-child shutdown on
  parent completion/error, but not a delegated async-`finally` child.
- Scenario 27: **Partial**. `test/run.test.ts` "background child error during
  sibling halt becomes task outcome" covers sibling error during halt, but not
  the delegated leak shape.
- Scenario 28: **Missing**. `test/race.test.ts` covers race winners and losers
  only at the result level; there is no direct loser async-`finally` cleanup
  regression.
- Scenario 29: **Partial**. `test/all.test.ts` "rejects when one of the
  operations reject" and "shuts down all tasks when anything fails" cover
  sibling halt on failure, but not post-delegation resurrection inside the
  halted member.
- Scenario 30: **Partial**. `test/scoped.test.ts` covers scoped teardown and
  code after `scoped()`, but not a delegated async-`finally` child within that
  boundary.
- Scenario 31: **Partial**. `test/scope.test.ts` "halts tasks that it contains
  when it is destroyed", "destroys derived scopes when a scope is destroyed",
  and "should close scope when using 'using'" cover scope-driven halt, but not
  delegated async cleanup with post-child code.

### Effection Boundary Comparisons

- Scenario 32: **Missing** as an active test. It is the core issue shape.
- Scenario 33: **Missing**. `test/call.test.ts` verifies call evaluation, but
  not halt propagation through a called operation with delegated async cleanup.
- Scenario 34: **Partial**. `test/scoped.test.ts` "does not execute code after
  scoped() when halted during async teardown" covers the desired boundary-level
  no-leak behavior, but not `yield* scoped(child)` where `child` itself contains
  the delegated async `finally`.
- Scenario 35: **Partial**. `test/spawn.test.ts` "halts child when halted",
  "rejects when child errors during halting", "halts when child finishes during
  asynchronous halt", and "runs destructors in reverse order and in series"
  cover spawned task halt behavior, but not the delegated child leak matrix.
- Scenario 36: **Partial**. `test/scope.test.ts` and `test/run.test.ts` cover
  `scope.run()`/task halt mechanics, but not delegated async cleanup with code
  after the child.
- Scenario 37: **Partial**. `test/resource.test.ts` covers resource finalizer
  ordering and `task.halt()` waiting for async cleanup, but not resurrection
  after a delegated async child.
- Scenario 38: **Partial**. `test/ensure.test.ts` "runs the given operation at
  the end of the task" covers async ensure cleanup completion, but not halt-time
  delegated resurrection.
- Scenario 39: **Partial**. `test/all.test.ts` covers sibling shutdown when
  `all()` fails, but not a halted member with delegated async `finally` and
  post-child code.
- Scenario 40: **Missing** for halt cleanup. Current `test/race.test.ts` does
  not assert loser teardown through async `finally`.

### Post-Halt Observable Behavior

- Scenarios 41-43: **Missing** for plain delegated async `finally`. Current
  tests do not observe normal code, a second `yield*`, or parent `catch` after
  the halted delegated child completes async cleanup.
- Scenario 44: **Partial**. `test/run.test.ts` "halts task when halted
  generator" and "can suspend in yielded finally block" cover parent `finally`
  execution, but not once-only behavior in the leaking post-child shape.
- Scenario 45: **Exact** for cleanup completion. Covered by `test/run.test.ts`
  "can perform async operations in a finally block", "can suspend in yielded
  finally block", `test/coroutine.test.ts` "uses 'return' for a single iteration
  when unwound", and `test/resource.test.ts` async cleanup tests.
- Scenario 46: **Exact**. `test/run.test.ts` repeatedly asserts that awaiting a
  halted task rejects with `"halted"`, including "can halt generator" and "can
  suspend in yielded finally block".
- Scenario 47: **Exact** for resource cleanup and **Partial** generally.
  `test/resource.test.ts` "task.halt() does not resolve until async resource
  cleanup finishes" directly covers halt waiting for resource finalizers;
  `test/run.test.ts` async-finally tests cover the simpler inline task case.
- Scenario 48: **Partial**. `test/scoped.test.ts` "does not execute code after
  scoped() when halted during async teardown" covers this for the scoped
  boundary shape, but plain delegated async `finally` remains missing.
- Scenario 49: **Partial**. `test/run.test.ts` "background child error during
  sibling halt becomes task outcome" and `test/trap.test.ts` "drops errors that
  are raised while a task is already halting" cover competing halt/error
  outcomes, but not delegated async child cleanup.
- Scenario 50: **Exact** for same-frame cleanup errors and spawned child halt
  errors. Covered by `test/run.test.ts` "throws an error in halt() if its
  finally block blows up" and `test/spawn.test.ts` "rejects when child errors
  during halting"; delegated child async-finally cleanup errors remain a
  separate missing variant.

### Related Non-Issue Coverage

- `test/all-settled.test.ts` "does not halt sibling operations when one fails"
  and "runs teardown for all operations before allSettled completes" are useful
  controls: they verify all-settled behavior and teardown completion, but
  `allSettled()` intentionally does not halt siblings on failure.
- `test/trap.test.ts` "unwinds through an error trap when halting" is a useful
  trap boundary control: it asserts no code after `trap()` runs during halt, but
  its cleanup is synchronous and does not exercise delegated async `finally`.
