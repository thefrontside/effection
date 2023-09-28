import { beforeEach, describe, expect, expectType, it } from "./suite.ts";

import type { Channel } from "../mod.ts";
import { createChannel, each, map, run, spawn } from "../mod.ts";
import type { Subscription } from "../lib/types.ts";

describe("Stream combinators", () => {
  let channel: Channel<string, string>;

  beforeEach(() => {
    channel = createChannel();
  });

  it("lets you map", () =>
    run(function* () {
      let upCase = map(function* (item: string) {
        return item.toUpperCase();
      });

      let subscription = yield* upCase(channel.output);

      expectType<Subscription<string, string>>(subscription);

      yield* channel.input.send("foo");

      let sub = subscription();
      let next = yield* sub.next();

      expect(next.done).toBe(false);
      expect(next.value).toBe("FOO");

      yield* channel.input.close("var");

      expect(yield* sub.next()).toEqual({
        done: true,
        value: "var",
      });
    }));

  it("lets you filter on subscription", () =>
    run(function* () {
      let counter = 0;
      let matchFoo = (item: string) => item === "foo";

      let task = yield* spawn(function* () {
        for (let result of yield* each(channel.output, matchFoo)) {
          expect(result).toBe("foo");
          counter += 1;
          if (counter == 2) {
            break;
          }
          yield* each.next;
        }
      });

      yield* channel.input.send("bob");
      yield* channel.input.send("foo");
      yield* channel.input.send("test");
      yield* channel.input.send("foo");
      yield* channel.input.close("done");

      yield* task;

      expect(counter).toBe(2);
    }));
});
