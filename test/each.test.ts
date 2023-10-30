import { describe, expect, it } from "./suite.ts";
import { createChannel, each, run, spawn, suspend } from "../mod.ts";

describe("each", () => {
  it("can be used to iterate a stream", async () => {
    await run(function* () {
      let { input, subscribe } = createChannel<string, void>();
      let actual = [] as string[];
      yield* spawn(function* () {
        for (let value of yield* each({ subscribe })) {
          actual.push(value);
          yield* each.next();
        }
      });

      yield* input.send("one");
      yield* input.send("two");
      yield* input.send("three");

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

      yield* outer.input.send("one");
      yield* inner.input.send("two");
      yield* inner.input.send("two and a half");
      yield* inner.input.close();
      yield* outer.input.send("three");
      yield* inner.input.send("four");
      yield* inner.input.close();
      yield* outer.input.close();

      expect(actual).toEqual(["one", "two", "two and a half", "three", "four"]);
    });
  });

  it("handles context correctly if you break out of a loop", async () => {
    await expect(run(function* () {
      let { input, subscribe } = createChannel<string>();

      yield* spawn(function* () {
        for (let _ of yield* each({ subscribe })) {
          break;
        }
        // we're out of the loop, each.next() should be invalid.
        yield* each.next();
      });

      yield* input.send("hello");
      yield* suspend();
    })).rejects.toHaveProperty("name", "IterationError");
  });

  it("throws an error if you forget to invoke each.next()", async () => {
    await expect(run(function* () {
      let { input, subscribe } = createChannel<string>();
      yield* spawn(function* () {
        for (let _ of yield* each({ subscribe })) {
          _;
        }
      });
      yield* input.send("hello");
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
