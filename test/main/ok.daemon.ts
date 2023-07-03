import { main } from "../../lib/main.ts";
import { sleep } from "../../lib/sleep.ts";

await main(function* () {
  console.log(`started: ${Deno.pid}`);

  try {
    yield* sleep(100_000_000);
  } finally {
    console.log(`gracefully stopped: ${Deno.pid}`);
  }
});
