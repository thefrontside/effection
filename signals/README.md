# Signals

Collection of immutable state containers for primitive data types.

## About

One way to think about Effection operation is as composable components of
asyncrony. They are conceptually similar to React components in that they're
functions that invoke other functions. As with React's component tree, Effection
operations are arranged into an operation tree. React components are designed to
make it easier to compose DOM where Effection operations are designed to make it
easier to compose asynchrony. Because of their simularities, it should come as
no surpise that they would share patterns for state management. React Context
and Effection Context is one example of this, but the benefits that
[unidirectional data flow](https://en.wikipedia.org/wiki/Unidirectional_data_flow)
provide to composition is another.

The Flux pattern, in tools like Redux and others, are "classic" ways to
implement one directional data from in React applications. Over the years, these
patterns involved into Signals which where implemented in variety of UI
frameworks. The design of Signals in the JavaScript ecosystem assume that they
will be integrated into some UI framework. Effection provides the necessary
components to have robust yet simple implementation of Signals that doesn't
require a UI framework.

### Included in this package

The collection of Signals included in this package rely on Effection's Signal
interface to provide immutable value streams with some operations. Each Signal
includes `set`, `update` and `valueOf` methods. Each data type also includes
methods provided by the primitive version of that data type. For example,
ArraySignal provides `push` and `shift`, while Set provides `difference`. We
don't implement all methods, mostly because haven't needed all of the methods.
If you need a method that we didn't implement but it's available in the
promitive type, please create a PR. If you need something else, use the `update`
method.

### Boolean Signal

The Boolean Signal provides a stream for a boolean value. You can set the value
which will cause the new value to be sent to the stream.

```ts
import { each, run, spawn } from "effection";
import { createBooleanSignal } from "@effectionx/signals";

await run(function* () {
  const boolean = yield* createBooleanSignal(true);

  yield* spawn(function* () {
    for (const update of yield* each(boolean)) {
      console.log(update);
      yield* each.next();
    }
  });

  boolean.set(false); // this will send false to the stream
  boolean.set(true); // this will send true to the stream
  boolean.set(true); // this won't send anything since the value hasn't changed
});
```

For an example of Boolean Signal in action, checkout the
[faucet](https://github.com/thefrontside/effectionx/blob/main/stream-helpers/test-helpers/faucet.ts)

### Array Signal

The Array Signal provides a stream for the value of the array. The value is
considered immutable - you shouldn't modify the value that comes through the
stream, instead invoke methods on the signal to cause a new value to be sent.

```ts
import { each, run, spawn } from "effection";
import { createArraySignal } from "@effectionx/signals";

await run(function* () {
  const array = yield* createArraySignal<number>([]);

  yield* spawn(function* () {
    for (const update of yield* each(array)) {
      console.log(update);
      yield* each.next();
    }
  });

  array.push(1, 2, 3); // this will be a single update
});
```

For an example of Array Signl, checkout the
[valve](https://github.com/thefrontside/effectionx/blob/main/stream-helpers/valve.ts)
and
[batch](https://github.com/thefrontside/effectionx/blob/main/stream-helpers/batch.ts)
stream helpers.

## Helpers

### is

`is` helper returns an operation that completes when the value of the stream
matches the predicate. It's useful when you want to wait for a signal to enter a
specific state. Some of the common use cases are waiting for an array to reach a
given length or for a boolean signal to become true or false.

`is` observes the signal's current state as well as any matching change, so it
completes deterministically without the producer having to `yield` or `sleep`
before publishing. It establishes its subscription before checking the current
value, so a matching update that lands while it is starting to wait is never
lost.

```ts
import { run, spawn } from "effection";
import { createBooleanSignal, is } from "@effectionx/signals";

await run(function* () {
  const open = yield* createBooleanSignal(false);

  yield* spawn(function* () {
    yield* is(open, (open) => open === true);
    console.log("floodgates are open!");
  });

  // No sleep or yield needed before publishing.
  open.set(true);
});
```
