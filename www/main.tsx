import { main, suspend } from "effection";

import { createRevolution } from "revolution";
import { docsRoute } from "./routes/docs-route.tsx";
import { indexRoute } from "./routes/index-route.tsx";
import { assetsRoute } from "./routes/assets-route.ts";

import { config } from "./tailwind.config.ts";

import { twindPlugin } from "./plugins/twind.ts";
import { rebasePlugin } from "./plugins/rebase.ts";
import { etagPlugin } from "./plugins/etag.ts";
import { route, sitemapPlugin } from "./plugins/sitemap.ts";

import { loadDocs } from "./docs/docs.ts";

await main(function* () {

  let docs = yield* loadDocs();

  let revolution = createRevolution({
    app: [
      route("/", indexRoute()),
      route("/docs/:id", docsRoute(docs)),
      route("/assets(.*)", assetsRoute("assets")),
    ],
    plugins: [
      twindPlugin({ config }),
      etagPlugin(),
      rebasePlugin(),
      sitemapPlugin(),
    ],
  });

  let server = yield* revolution.start();
  console.log(`www -> http://${server.hostname}:${server.port}`);

  yield* suspend();
});
