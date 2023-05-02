import { beforeEach, describe, expect, expectType, it } from "./suite.ts";

import type { Channel } from "../mod.ts";
import { createChannel, filter, map, op, pipe, run } from "../mod.ts";
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

      let next = yield* subscription.next();

      expect(next.done).toBe(false);
      expect(next.value).toBe("FOO");

      yield* channel.input.close("var");

      expect(yield* subscription.next()).toEqual({
        done: true,
        value: "var",
      });
    }));

  it("lets you filter", () =>
    run(function* () {
      let longs = filter(function* (a: string) {
        return a.length > 3;
      });

      let subscription = yield* longs(channel.output);

      expectType<Subscription<string, string>>(subscription);

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

  it("lets you map and filter in combination", () =>
    run(function* () {
      let upCase = map(function* (item: string) {
        return item.toUpperCase();
      });

      let shorts = filter(function* (a: string) {
        return a.length < 4;
      });

      let subscription = yield* pipe(channel.output, shorts, upCase);

      expectType<Subscription<string, string>>(subscription);

      yield* channel.input.send("too long");
      yield* channel.input.send("too long 2");
      yield* channel.input.send("too long 3");
      yield* channel.input.send("foo");

      let next = yield* subscription.next();

      expect(next.done).toBe(false);
      expect(next.value).toBe("FOO");

      yield* channel.input.close("var");

      expect(yield* subscription.next()).toEqual({
        done: true,
        value: "var",
      });
    }));

  it("lets you pass an ordinary function for a predicate", () =>
    run(function* () {
      let upCase = map(op((item: string) => {
        return item.toUpperCase();
      }));

      let shorts = filter(op((a: string) => {
        return a.length < 4;
      }));

      let subscription = yield* pipe(channel.output, shorts, upCase);

      expectType<Subscription<string, string>>(subscription);

      yield* channel.input.send("too long");
      yield* channel.input.send("too long 2");
      yield* channel.input.send("too long 3");
      yield* channel.input.send("foo");

      let next = yield* subscription.next();

      expect(next.done).toBe(false);
      expect(next.value).toBe("FOO");

      yield* channel.input.close("var");

      expect(yield* subscription.next()).toEqual({
        done: true,
        value: "var",
      });
    }));
});
