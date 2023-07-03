import { sleep } from "../../lib/sleep.ts";
import { exit, main } from "../../lib/main.ts";
import { spawn, suspend } from "../../lib/instructions.ts";

await main(function* () {
  yield* spawn(function* () {
    try {
      yield* suspend();
    } finally {
      console.log("graceful goodbye");
    }
  });

  yield* sleep(10);
  yield* exit(23, "It all went horribly wrong");
});
