import { call, type Operation } from "../../../mod.ts";
import { scenario } from "./scenario.ts";

await scenario("effection.recursion", recurse);

function* recurse(depth: number): Operation<void> {
  if (depth > 1) {
    yield* recurse(depth - 1);
  } else {
    for (let i = 0; i < 100; i++) {
      yield* call(() => Promise.resolve());
    }
  }
}
