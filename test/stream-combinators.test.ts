import { beforeEach, describe, expect, expectType, it } from "./suite.ts";

import type { Channel } from "../mod.ts";
import { createChannel, map, run } from "../mod.ts";
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

      expectType<() => Subscription<string, string>>(subscription);

      yield* channel.input.send("foo");

      let next = yield* subscription().next();

      expect(next.done).toBe(false);
      expect(next.value).toBe("FOO");

      yield* channel.input.close("var");

      expect(yield* subscription().next()).toEqual({
        done: true,
        value: "var",
      });
    }));

  it.only("lets you filter", () =>
    run(function* () {
      let longs = (a: string) => {
        console.log(a);
        return a.length > 3;
      };

      let sub = yield* channel.output;

      expectType<(p: (v: string) => boolean) => Subscription<string, string>>(
        sub,
      );

      let subscription = sub(longs);
      yield* channel.input.send("no");
      yield* channel.input.send("way");
      yield* channel.input.send("good");

      let next = yield* subscription.next();

      expect(next.done).toBe(false);
      expect(next.value).toBe("good");

      yield* channel.input.close("var");

      expect(yield* subscription.next()).toEqual({
        done: true,
        value: "var",
      });
    }));
});
