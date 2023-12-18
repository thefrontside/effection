import { describe, expect, it } from "./suite.ts";
import { createChannel, each, run, spawn, suspend } from "../mod.ts";

describe("each", () => {
  it("can be used to iterate a stream", async () => {
    await run(function* () {
      let channel = createChannel<string, void>();
      let actual = [] as string[];
      yield* spawn(function* () {
        for (let value of yield* each(channel)) {
          actual.push(value);
          yield* each.next();
        }
      });

      yield* channel.send("one");
      yield* channel.send("two");
      yield* channel.send("three");

      expect(actual).toEqual(["one", "two", "three"]);
    });
  });

  it("can be used to iterate nested streams", async () => {
    await run(function* () {
      let actual = [] as string[];
      let outer = createChannel<string>();
      let inner = createChannel<string>();

      yield* spawn(function* () {
        for (let value of yield* each(outer)) {
          actual.push(value);
          for (let value of yield* each(inner)) {
            actual.push(value);
            yield* each.next();
          }
          yield* each.next();
        }
      });

      yield* outer.send("one");
      yield* inner.send("two");
      yield* inner.send("two and a half");
      yield* inner.close();
      yield* outer.send("three");
      yield* inner.send("four");
      yield* inner.close();
      yield* outer.close();

      expect(actual).toEqual(["one", "two", "two and a half", "three", "four"]);
    });
  });

  it("handles context correctly if you break out of a loop", async () => {
    await expect(run(function* () {
      let channel = createChannel<string>();

      yield* spawn(function* () {
        for (let _ of yield* each(channel)) {
          break;
        }
        // we're out of the loop, each.next() should be invalid.
        yield* each.next();
      });

      yield* channel.send("hello");
      yield* suspend();
    })).rejects.toHaveProperty("name", "IterationError");
  });

  it("throws an error if you forget to invoke each.next()", async () => {
    await expect(run(function* () {
      let channel = createChannel<string>();
      yield* spawn(function* () {
        for (let _ of yield* each(channel)) {
          _;
        }
      });
      yield* channel.send("hello");
      yield* suspend();
    })).rejects.toHaveProperty("name", "IterationError");
  });

  it("throws an error if you invoke each.next() out of context", async () => {
    await expect(run(() => each.next())).rejects.toHaveProperty(
      "name",
      "MissingContextError",
    );
  });
});
