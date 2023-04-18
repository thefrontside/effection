import { createChannel, fixed, pipe, run, sleep, sliding, spawn } from "../mod.ts";

import { describe, expect, it } from "./suite.ts";

const tests = describe("buffers");

it(tests, "fixed buffer should throw", async () => {
  const task = run(function* () {
    let buffer = pipe(fixed(2));
    let chan = createChannel();
    let st = yield* buffer(chan);

    yield* spawn(function* () {
      yield* chan.input.send("1");
      yield* chan.input.send("2");
      yield* chan.input.send("3");
    });

    yield* sleep(10);
    while (true) {
      const result = yield* st;
      if (!result) {
        break;
      }

      yield* sleep(10);
    }
  });

  try {
    await task;
  } catch (err) {
    expect(err.message).toBe('buffer overflow!')
  }
});

it(tests, "sliding buffer should shift messages", async () => {
  const actual: string[] = [];
  await run(function* () {
    let buffer = pipe(sliding<string>(2));
    let chan = createChannel<string>();
    let st = yield* buffer(chan);

    yield* spawn(function* () {
      yield* chan.input.send("1");
      yield* chan.input.send("2");
      yield* chan.input.send("3");
      yield* chan.input.send("4");
      yield* chan.input.send("5");
    });

    yield* sleep(10);
    while (true) {
      const result = yield* st;
      if (!result) {
        break;
      }

      actual.push(result);
      yield* sleep(10);
    }
  });
  expect(actual).toEqual(['4', '5']);
});
