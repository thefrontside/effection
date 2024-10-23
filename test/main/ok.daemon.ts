import { main, sleep } from "../../mod.ts";

await main(function* () {
  console.log(`started: ${Deno.pid}`);

  try {
    yield* sleep(100_000_000);
  } finally {
    console.log(`gracefully stopped: ${Deno.pid}`);
  }
});
