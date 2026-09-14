import { describe, expect, it } from "./suite.ts";
import {
  createChannel,
  each,
  type Operation,
  resource,
  run,
  spawn,
  type Stream,
} from "../mod.ts";

describe("each", () => {
  it("can be used to iterate a stream", async () => {
    await run(function* () {
      let actual = [] as string[];
      let channel = sequence("one", "two", "three");
      let consumer = yield* spawn(function* () {
        for (let value of yield* each(channel)) {
          actual.push(value);
          yield* each.next();
        }
      });

      yield* consumer;

      expect(actual).toEqual(["one", "two", "three"]);
    });
  });

  it("can be used to iterate nested streams", async () => {
    await run(function* () {
      let actual = [] as string[];
      let outer = sequence("one", "two");
      let inner = sequence("three", "four", "five");

      for (let value of yield* each(outer)) {
        actual.push(value);
        for (let value of yield* each(inner)) {
          actual.push(value);
          yield* each.next();
        }
        yield* each.next();
      }

      expect(actual).toEqual([
        "one",
        "three",
        "four",
        "five",
        "two",
        "three",
        "four",
        "five",
      ]);
    });
  });

  it("can iterate a pre-subscribed stream in a spawned task", async () => {
    await run(function* () {
      let channel = createChannel<string, void>();
      let subscription = yield* channel;
      let items: string[] = [];

      let consumer = yield* spawn(function* () {
        for (let item of yield* each(subscription)) {
          items.push(item);
          yield* each.next();
        }
      });

      yield* channel.send("one");
      yield* channel.send("two");
      yield* channel.close();
      yield* consumer;

      expect(items).toEqual(["one", "two"]);
    });
  });

  it("handles context correctly if you break out of a loop", async () => {
    await expect(run(function* () {
      let seq = sequence("hello world");

      for (let _ of yield* each(seq)) {
        break;
      }

      // we're out of the loop, each.next() should be invalid.
      yield* each.next();
    })).rejects.toHaveProperty("name", "IterationError");
  });

  it("throws an error if you forget to invoke each.next()", async () => {
    await expect(run(function* () {
      let seq = sequence("hello");

      for (let _ of yield* each(seq)) {
        _;
      }
    })).rejects.toHaveProperty("name", "IterationError");
  });

  it("throws an error if you invoke each.next() out of context", async () => {
    await expect(run(() => each.next())).rejects.toHaveProperty(
      "name",
      "MissingContextError",
    );
  });

  it("closes the stream after exiting from the loop", async () => {
    let state = { status: "pending" };
    let stream: Stream<string, void> = resource(function* (provide) {
      try {
        state.status = "active";
        yield* provide(yield* sequence("one", "two"));
      } finally {
        state.status = "closed";
      }
    });

    await run(function* () {
      yield* spawn(function* () {
        for (let _ of yield* each(stream)) {
          expect(state.status).toEqual("active");
          yield* each.next();
        }

        expect(state.status).toEqual("closed");
      });
    });
  });
});

function sequence(...values: string[]): Stream<string, void> {
  return {
    *[Symbol.iterator]() {
      let items = values.slice();
      return {
        *next(): Operation<IteratorResult<string, void>> {
          let value = items.shift();
          if (typeof value !== "undefined") {
            return { done: false, value };
          } else {
            return { done: true, value: undefined };
          }
        },
      };
    },
  };
}
