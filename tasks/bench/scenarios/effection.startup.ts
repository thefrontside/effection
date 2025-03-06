import { call, type Operation } from "../../../mod.ts";
import { scenario } from "./scenario.ts";

await scenario("effection.startup", function* (_, exit) {
  function* startup(): Operation<void> {
    exit(performance.now());
    yield* call(() => Promise.resolve());
  }

  return yield* startup();
});
