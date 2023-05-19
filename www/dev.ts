import { action, run, suspend } from "effection";

import { useServer } from "freejack/server.ts";
import { main } from "./routes/main.tsx";

await run(function* () {
  yield* action<void>(function* (resolve) {
    let server = yield* useServer({
      app: main,
      port: 8088,
    });

    console.log(`freejack -> https://${server.hostname}:${server.port}`);

    Deno.addSignalListener("SIGINT", resolve);
    try {
      yield* suspend();
    } finally {
      Deno.removeSignalListener("SIGINT", resolve);
    }
  });
  console.log("exiting...");
});
