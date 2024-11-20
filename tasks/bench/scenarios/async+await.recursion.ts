import { call } from "../../../mod.ts";
import { scenario } from "./scenario.ts";

await scenario("async+await.recursion", (depth) => call(() => recurse(depth)));

async function recurse(depth: number): Promise<void> {
  if (depth > 1) {
    await recurse(depth - 1);
  } else {
    for (let i = 0; i < 100; i++) {
      await Promise.resolve();
    }
  }
}
