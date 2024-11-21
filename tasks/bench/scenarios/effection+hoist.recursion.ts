import { hoist } from "../../../lib/hoist.ts";
import { call, Operation } from "../../../mod.ts";
import { scenario } from "./scenario.ts";

await scenario("effection+hoist.recursion", recurse);

function* recurse(depth: number): Operation<void> {
  if (depth > 1) {
    yield hoist(recurse(depth - 1));
  } else {
    for (let i = 0; i < 100; i++) {
      yield* call(() => Promise.resolve());
    }
  }
}
