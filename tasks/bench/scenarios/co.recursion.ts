import co from "npm:co";
import { call } from "../../../mod.ts";
import { scenario } from "./scenario.ts";

await scenario("co.recursion", (depth, _exit) =>
  call(() => co(recurse, depth)),
);

function* recurse(depth: number): Generator<unknown, void> {
  if (depth > 1) {
    yield recurse(depth - 1);
  } else {
    for (let i = 0; i < 100; i++) {
      yield Promise.resolve();
    }
  }
}
