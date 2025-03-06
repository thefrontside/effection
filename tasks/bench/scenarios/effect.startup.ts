import { Effect } from "npm:effect";
import { call } from "../../../mod.ts";
import { scenario } from "./scenario.ts";

await scenario("effect.startup", function* (_, exit) {
  const startup = Effect.gen(function* () {
    exit(performance.now());
    yield* Effect.promise(() => Promise.resolve());
  });

  return yield* call(() => Effect.runPromise(startup));
});
