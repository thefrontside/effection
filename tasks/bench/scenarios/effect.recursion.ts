import { Effect } from "npm:effect";
import { call } from "../../../mod.ts";
import { scenario } from "./scenario.ts";

await scenario(
  "effect.recursion",
  (depth) => call(() => Effect.runPromise(recurse(depth))),
);

function recurse(depth: number): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    if (depth > 1) {
      yield* recurse(depth - 1);
    } else {
      for (let i = 0; i < 100; i++) {
        yield* Effect.promise(() => Promise.resolve());
      }
    }
  });
}
