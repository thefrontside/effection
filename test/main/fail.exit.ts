import { exit, main, sleep, spawn, suspend } from "../../mod.ts";

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
