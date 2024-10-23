import { main, suspend } from "../../mod.ts";

await main(function* () {
  console.log("started");
  try {
    yield* suspend();
  } finally {
    console.log("gracefully stopped");
  }
});
