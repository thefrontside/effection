import { call, type Operation } from "../../../mod.ts";
import { scenario } from "./scenario.ts";

await scenario("effection.startup", function* (_, exit) {
  let start = performance.now();

  function* startup(): Operation<void> {
    exit(performance.now() - start);
    yield* call(() => Promise.resolve());
  }

  return yield* startup();
});
