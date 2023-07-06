import { sleep } from "../../lib/sleep.ts";
import { spawn, suspend } from "../../lib/instructions.ts";
import { exit, main } from "../../lib/main.ts";

await main(function* () {
  yield* spawn(function* () {
    try {
      yield* suspend();
    } finally {
      console.log("goodbye.");
    }
  });

  yield* sleep(10);

  yield* exit(0, "Ok, computer.");
});
