import { main, suspend } from "effection";

import { useServer } from "freejack/server.ts";
import serve from "./server.ts";

await main(function* () {
  let server = yield* useServer({
    serve,
    port: 8000,
    dir: new URL(".", import.meta.url).pathname,
  });

  console.log(`www -> http://${server.hostname}:${server.port}`);

  yield* suspend();
});
