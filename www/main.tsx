import { main, suspend } from "effection";

import { createRevolution, route, serveDirMiddleware } from "revolution";
import { docsRoute } from "./routes/docs-route.tsx";
import { indexRoute } from "./routes/index-route.tsx";
import { v2docsRoute } from "./routes/v2docs-route.tsx";
import { baseUrlMiddleware } from "./middleware/base-url.ts";
import { rebaseMiddleware } from "./middleware/rebase.ts";
import { etagMiddleware } from "./middleware/etag.ts";
import { twindRevolution } from "./lib/twind.ts";
import { config } from "./twind.config.ts";

import { loadDocs } from "./docs/docs.ts";
import { loadV2Docs } from "./docs/v2-docs.ts";

await main(function* () {
  let v2docs = yield* loadV2Docs({
    fetchEagerly: !!Deno.env.get("V2_DOCS_FETCH_EAGERLY"),
    revision: Number(Deno.env.get("V2_DOCS_REVISION") ?? 4),
  });

  let docs = yield* loadDocs();

  let app = createRevolution({
    jsx: [
      route("/", indexRoute()),
      route("/docs/:id", docsRoute(docs)),
    ],
    html: [
      rebaseMiddleware(),
      twindRevolution({ config }),
    ],
    http: [
      route("/V2(.*)", v2docsRoute(v2docs)),
      route(
        "/assets(.*)",
        serveDirMiddleware({
          fsRoot: new URL(import.meta.resolve("./assets")).pathname,
          urlRoot: "assets",
        }),
      ),
      baseUrlMiddleware(),
      etagMiddleware(),
    ],
  });

  let server = yield* app.start();
  console.log(`www -> http://${server.hostname}:${server.port}`);

  yield* suspend();
});
