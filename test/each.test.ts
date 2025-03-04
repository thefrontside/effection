import { describe, expect, it } from "./suite.ts";
import {
  createChannel,
  createQueue,
  each,
  resource,
  run,
  spawn,
  type Stream,
  suspend,
} from "../mod.ts";

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
      });
    });

    expect(state.status).toEqual("closed");
  });
});

function sequence(...values: string[]): Stream<string, void> {
  return resource(function* (provide) {
    let q = createQueue<string, void>();
    for (let value of values) {
      q.add(value);
    }
    q.close();
    yield* provide(q);
  });
}
