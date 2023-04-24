import { describe, expect, it } from "./suite.ts";
import { createChannel, Operation, run, sleep, spawn, Stream } from "../mod.ts";

let tests = describe("iter()");

interface Iteration<T, TResult> extends Iterable<Operation<T>> {
  result: Operation<TResult>;
}

function* iterate<T, TResult>(
  stream: Stream<T, TResult>,
): Operation<Iteration<T, TResult>> {
  let sub = yield* stream;
  let first = yield* sub;
  let result: TResult;
  if (first.done) {
    result = first.value;
  }

  return {
    *[Symbol.iterator]() {
      if (result) {
        return result;
      }

      return {
        *[Symbol.iterator]() {
          yield (first.value) as T;
          let next = first;

          while (true) {
            // next = yield* sub;
            yield next;
          }
        },
      };
    },
    result: {
      *[Symbol.iterator]() {
        return result;
      },
    },
  };
}

it(tests, "should iterate", async () => {
  const chan = createChannel<string>();
  let actual = await run(function* () {
    yield* spawn(function* () {
      yield* sleep(10);
      yield* chan.input.send("1");
      yield* chan.input.send("2");
      yield* chan.input.send("3");
      yield* chan.input.close();
    });

    let iter = yield* iterate(chan.output);
    let arr: string[] = [];
    for (let msg of yield* iter) {
      console.log(msg);
      let val = yield* msg;
      console.log(val);
      arr.push(val);
    }
    return { arr, result: iter.result};
  });

  expect(actual).toEqual({ arr: [], result: undefined });
});
