import { describe, expect, it } from "./suite.ts";
import { createFuture } from "../lib/future.ts";
import { createChannel, Operation, run, sleep, spawn, Stream } from "../mod.ts";

let tests = describe("iter()");

interface Iteration<T, TResult> extends Iterable<Operation<T>> {
  result: Operation<TResult>;
}

function* iterate<T, TResult>(
  stream: Stream<T, TResult>,
): Operation<Iteration<T, TResult>> {
  let sub = yield* stream;
  let latest = yield* sub;

  let { future: result, resolve } = createFuture<TResult>();

  function next(): IteratorResult<Operation<T>, TResult> {
    if (latest.done) {
      return latest;
    } else {
      return {
        done: false,
        value: {
          *[Symbol.iterator]() {
            let { value } = latest;
            latest = yield* sub;
            if (latest.done) {
              resolve(latest.value);
            }
            // we know that this must be a `T`, not `TResult` because
            // it is left over from the last iteration which we we checked
            // on the last iteration on line 29.
            return value as T;
          },
        },
      };
    }
  }

  return {
    [Symbol.iterator]: () => ({ next }),
    result,
  };
}

it(tests, "should iterate", async () => {
  const chan = createChannel<string, number>();
  let actual = await run(function* () {
    yield* spawn(function* () {
      yield* sleep(10);
      yield* chan.input.send("1");
      yield* chan.input.send("2");
      yield* chan.input.send("3");
      yield* chan.input.close(42);
    });

    let iter = yield* iterate(chan.output);
    let arr: string[] = [];
    for (let msg of iter) {
      let val = yield* msg;
      arr.push(val);
    }
    return { arr, result: yield* iter.result };
  });

  expect(actual).toEqual({ arr: ["1", "2", "3"], result: 42 });
});

it(tests, "should iterate an empty stream", async () => {
  const chan = createChannel<string, number>();
  await run(function* () {
    yield* spawn(function* () {
      yield* sleep(10);
      yield* chan.input.close(42);
    });

    for (let msg of yield* iterate(chan.output)) {
      throw new Error("This block of code should never be reached: " + msg);
    }
  });
});
