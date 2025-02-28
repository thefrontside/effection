import { Effect, Fiber, Stream } from "npm:effect";
import { call } from "../../../mod.ts";
import { scenario } from "./scenario.ts";

await scenario(
  "effect.events",
  (depth) => call(() => Effect.runPromise(start(depth))),
);

export function start(depth: number) {
  return Effect.gen(function* () {
    const target = new EventTarget();
    const task = yield* Effect.fork(recurse(target, depth));
    for (let i = 0; i < 100; i++) {
      yield* Effect.sleep(0);
      target.dispatchEvent(new Event("foo"));
    }
    yield* Effect.sleep(0);
    yield* Fiber.interrupt(task);
  });
}

function recurse(
  target: EventTarget,
  depth: number,
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    const eventStream = Stream.fromEventListener(target, "foo");

    if (depth > 1) {
      const subTarget = new EventTarget();
      yield* Effect.fork(recurse(subTarget, depth - 1));

      yield* eventStream.pipe(
        Stream.runForEach(() => {
          return Effect.sync(() => {
            subTarget.dispatchEvent(new Event("foo"));
          });
        }),
      );
    } else {
      yield* eventStream.pipe(Stream.runDrain);
    }
  });
}
