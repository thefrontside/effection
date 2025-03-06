import { Effect, Fiber } from "npm:effect";
import { call, ensure } from "../../../mod.ts";
import { scenario } from "./scenario.ts";

await scenario("effect.startup", function* (_, exit) {
  let start = performance.now();

  const startup = Effect.gen(function* () {
    exit(performance.now() - start);
    yield* Effect.promise(() => Promise.resolve());
  });

  const fiber = Effect.runFork(startup);

  yield* ensure(function* () {
    yield* call(() => Effect.runPromise(Fiber.interrupt(fiber)));
  });

  return yield* call(() => Effect.runPromise(Fiber.join(fiber)));
});
