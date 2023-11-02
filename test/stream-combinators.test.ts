import { beforeEach, describe, expect, expectType, it } from "./suite.ts";

import type { Channel } from "../mod.ts";
import { createChannel, filter, lift, map, pipe, run } from "../mod.ts";
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

      let subscription = yield* upCase(channel).subscribe();

      expectType<Subscription<string, string>>(subscription);

      yield* channel.send("foo");

      let next = yield* subscription.next();

      expect(next.done).toBe(false);
      expect(next.value).toBe("FOO");

      yield* channel.close("var");

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

      let subscription = yield* longs(channel).subscribe();

      expectType<Subscription<string, string>>(subscription);

      yield* channel.send("no");
      yield* channel.send("way");
      yield* channel.send("good");

      let next = yield* subscription.next();

      expect(next.done).toBe(false);
      expect(next.value).toBe("good");

      yield* channel.close("var");

      expect(yield* subscription.next()).toEqual({
        done: true,
        value: "var",
      });
    }));

  it("lets you map and filter in combination", () =>
    run(function* () {
      let shorts = filter(function* (a: string) {
        return a.length < 4;
      });

      let length = map(function* (item: string) {
        return item.length;
      });

      let subscription = yield* pipe(channel, shorts, length).subscribe();

      expectType<Subscription<number, string>>(subscription);

      yield* channel.send("too long");
      yield* channel.send("too long 2");
      yield* channel.send("too long 3");
      yield* channel.send("foo");

      let next = yield* subscription.next();

      expect(next.done).toBe(false);
      expect(next.value).toBe("foo".length);

      yield* channel.close("var");

      expect(yield* subscription.next()).toEqual({
        done: true,
        value: "var",
      });
    }));

  it("lets you pass an ordinary function for a predicate", () =>
    run(function* () {
      let upCase = map(lift((item: string) => {
        return item.toUpperCase();
      }));

      let shorts = filter(lift((a: string) => {
        return a.length < 4;
      }));

      let subscription = yield* pipe(channel, shorts, upCase).subscribe();

      expectType<Subscription<string, string>>(subscription);

      yield* channel.send("too long");
      yield* channel.send("too long 2");
      yield* channel.send("too long 3");
      yield* channel.send("foo");

      let next = yield* subscription.next();

      expect(next.done).toBe(false);
      expect(next.value).toBe("FOO");

      yield* channel.close("var");

      expect(yield* subscription.next()).toEqual({
        done: true,
        value: "var",
      });
    }));
});
