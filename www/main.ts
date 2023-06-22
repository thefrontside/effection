import { action, run, suspend } from "effection";

import { useServer } from "freejack/server.ts";
import serve from "./server.ts";

await run(function* () {
  yield* action<void>(function* (resolve) {
    let server = yield* useServer({
      serve,
      port: 8000,
      dir: new URL(".", import.meta.url).pathname,
    });

    console.log(`freejack -> http://${server.hostname}:${server.port}`);

    Deno.addSignalListener("SIGINT", resolve);
    try {
      yield* suspend();
    } finally {
      Deno.removeSignalListener("SIGINT", resolve);
    }
  });
  console.log("exiting...");
});
