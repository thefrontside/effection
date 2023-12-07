import { suspend } from "../../lib/instructions.ts";
import { main } from "../../lib/main.ts";

await main(function* () {
  console.log("started");
  try {
    yield* suspend();
  } finally {
    console.log("gracefully stopped");
  }
});
