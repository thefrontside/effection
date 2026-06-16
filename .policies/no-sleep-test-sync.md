# No-Sleep Test Synchronization Policy (Recommended)

This document defines the recommended policy for test synchronization without using `sleep()`.

## Core Principle

**Tests must not use `sleep()` for synchronization; use `streamOf()` or other deterministic helpers instead.**

## The Rule

| Scenario | Required Approach |
|----------|-------------------|
| Creating test stream data | Use `streamOf([1, 2, 3])` from `@effectionx/stream-helpers` |
| Yielding control (no delay) | `sleep(0)` is acceptable |
| Simulating async in test setup | `sleep()` OK inside spawned task that triggers the condition |
| Waiting for a callback | Use `withResolvers()` from `effection` |
| Polling for state change | Use `when()` from `@effectionx/converge` |
| Waiting for signal state | Use `is(signal, predicate)` from `@effectionx/signals` |

**Key distinction:** Using `sleep()` to *create* an async scenario (inside a spawned task) is fine. Using `sleep()` to *wait for* a result is not—use deterministic helpers instead.

## Examples

### Compliant: Using streamOf() for test data

From `stream-helpers/reduce.test.ts`:

```typescript
import { streamOf, reduce, forEach } from "@effectionx/stream-helpers";

it("accumulates its value from the initial", function* () {
  let stream = streamOf([1, 2, 3]);

  let sum = reduce(function* (total, current: number) {
    return total + current;
  }, 0);

  let sequence: number[] = [];
  yield* forEach(function* (item) {
    sequence.push(item);
  }, sum(stream));

  expect(sequence).toEqual([1, 3, 6]);
});
```

### Compliant: sleep(0) for yielding control

```typescript
it("processes items concurrently", function* () {
  yield* spawn(function* () {
    yield* sleep(0); // Yields control, no real delay
    yield* channel.send(value);
  });
});
```

### Compliant: withResolvers() to wait for callback

From `signals/helpers.test.ts`:

```typescript
import { spawn, withResolvers } from "effection";
import { createBooleanSignal, is } from "@effectionx/signals";

it("waits until the value of the stream matches the predicate", function* () {
  const open = yield* createBooleanSignal(false);
  const update: string[] = [];

  const { resolve, operation } = withResolvers<void>();

  yield* spawn(function* () {
    yield* is(open, (open) => open === true);
    update.push("floodgates are open!");
    resolve();
  });

  yield* spawn(function* () {
    // is() observes the change deterministically; no sleep needed first.
    open.set(true);
  });

  yield* operation;

  expect(update).toEqual(["floodgates are open!"]);
});
```

### Compliant: when() for polling state

From `converge/converge.test.ts`:

```typescript
import { sleep, spawn } from "effection";
import { when } from "@effectionx/converge";

it("resolves when the assertion passes within the timeout", function* () {
  let total = 0;
  yield* spawn(function* () {
    yield* sleep(30);
    total = 5;
  });

  let stats = yield* when(
    function* () {
      if (total !== 5) throw new Error(`expected 5, got ${total}`);
      return total;
    },
    { timeout: 100 },
  );

  expect(stats.value).toEqual(5);
});
```

### Compliant: is() with signals for state changes

Wait for a signal to reach a target state with `is()`. The producer publishes
immediately — `is()` observes the matching change deterministically, so no
`sleep()` is required to "give the consumer time to subscribe":

```typescript
import { each, spawn } from "effection";
import { createArraySignal, is } from "@effectionx/signals";
import { useFaucet } from "@effectionx/stream-helpers";

it("creates a faucet that can pour items", function* () {
  const faucet = yield* useFaucet<number>({ open: true });
  const results = yield* createArraySignal<number>([]);

  yield* spawn(function* () {
    for (const item of yield* each(faucet)) {
      results.push(item);
      yield* each.next();
    }
  });

  yield* spawn(function* () {
    yield* faucet.pour([1, 2, 3]);
  });

  // Wait for signal state instead of sleep
  yield* is(results, (results) => results.length === 3);

  expect(results.valueOf()).toEqual([1, 2, 3]);
});
```

### Non-Compliant: Using sleep to wait for async completion

```typescript
it("waits for processing", function* () {
  yield* triggerAsyncWork();
  yield* sleep(100); // BAD: using sleep to WAIT for result
  expect(result).toBeDefined();
});

// GOOD: Use a deterministic helper to wait
it("waits for processing", function* () {
  const result = yield* createSignal<Result | undefined>(undefined);
  yield* spawn(function* () {
    result.set(yield* triggerAsyncWork());
  });
  yield* is(result, (r) => r !== undefined); // Deterministic wait
  expect(result.valueOf()).toBeDefined();
});
```

### Non-Compliant: Creating streams with sleeps when streamOf() works

```typescript
it("processes stream", function* () {
  // BAD: unnecessary complexity when streamOf([1,2,3]) would work
  const channel = createChannel<number>();
  yield* spawn(function* () {
    yield* sleep(10);
    yield* channel.send(1);
    yield* sleep(10);
    yield* channel.send(2);
  });
});
```

## Verification Checklist

- [ ] No `sleep(ms)` where `ms > 0` used to **wait for** async results
- [ ] `sleep()` inside spawned tasks to **trigger** conditions is acceptable
- [ ] `streamOf()` used for fixed test data instead of manual channel/sleep patterns
- [ ] `withResolvers()` used when waiting for callbacks
- [ ] `when()` used for polling state changes
- [ ] `is(signal, predicate)` used for waiting on signal state

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `sleep(100)` to **wait for** callback | Use `withResolvers()` from `effection` |
| `sleep(100)` to **wait for** DOM/state | Use `when()` from `@effectionx/converge` |
| `sleep(100)` to **wait for** signal | Use `is(signal, predicate)` from `@effectionx/signals` |
| Manual channel + sleep for test data | Use `streamOf([...])` |
| Long sleep to ensure completion | Use `useFaucet()` or proper synchronization |

Note: `sleep()` inside a spawned task to **trigger** an async condition is fine—the issue is using sleep to **wait** for results.

## Related Policies

- [Policies Index](./index.md)
