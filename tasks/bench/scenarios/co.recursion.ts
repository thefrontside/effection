import { call } from "../../../mod.ts";
import { scenario } from "./scenario.ts";
import co from "npm:co";

await scenario("co.recursion", (depth) => call(() => co(recurse, depth)));

function* recurse(depth: number): Generator<unknown, void> {
  if (depth > 1) {
    yield recurse(depth - 1);
  } else {
    for (let i = 0; i < 100; i++) {
      yield Promise.resolve();
    }
  }
}
