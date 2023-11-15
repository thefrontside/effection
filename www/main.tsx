import { main, suspend } from "effection";

import { createRevolution, route } from "revolution";
import { docsRoute } from "./routes/docs-route.tsx";
import { indexRoute } from "./routes/index-route.tsx";
import { v2docsRoute } from "./routes/v2docs-route.tsx";
import { assetsRoute } from "./routes/assets-route.ts";

import { config } from "./twind.config.ts";

import { twindPlugin } from "./plugins/twind.ts";
import { rebasePlugin } from "./plugins/rebase.ts";
import { etagPlugin } from "./plugins/etag.ts";

import { loadDocs } from "./docs/docs.ts";
import { loadV2Docs } from "./docs/v2-docs.ts";

await main(function* () {
  let v2docs = yield* loadV2Docs({
    fetchEagerly: !!Deno.env.get("V2_DOCS_FETCH_EAGERLY"),
    revision: Number(Deno.env.get("V2_DOCS_REVISION") ?? 4),
  });

  let docs = yield* loadDocs();

  let revolution = createRevolution({
    app: [
      route("/", indexRoute()),
      route("/docs/:id", docsRoute(docs)),
      route("/assets(.*)", assetsRoute("assets")),
      route("/V2(.*)", v2docsRoute(v2docs)),
    ],
    plugins: [
      twindPlugin({ config }),
      etagPlugin(),
      rebasePlugin(),
    ],
  });

  let server = yield* revolution.start();
  console.log(`www -> http://${server.hostname}:${server.port}`);

  yield* suspend();
});
