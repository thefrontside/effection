import { main, suspend } from "effection";
import { createRevolution, ServerInfo } from "revolution";
import { initDenoDeploy } from "jsr:@effection-contrib/deno-deploy@0.1.0";

import { config } from "./tailwind.config.ts";

import { etagPlugin } from "./plugins/etag.ts";
import { rebasePlugin } from "./plugins/rebase.ts";
import { route, sitemapPlugin } from "./plugins/sitemap.ts";
import { twindPlugin } from "./plugins/twind.ts";

import { assetsRoute } from "./routes/assets-route.ts";
import { docsRoute } from "./routes/docs-route.tsx";
import { indexRoute } from "./routes/index-route.tsx";
import { apiVersionRoute } from "./routes/api/version-route.tsx";
import { contribIndexRoute } from "./routes/contrib/index-route.tsx";
import { contribPackageRoute } from "./routes/contrib/package-route.tsx";

import { patchDenoPermissionsQuerySync } from "./deno-deploy-patch.ts";
import { loadDocs } from "./docs/docs.ts";
import { loadRepository } from "./resources/repository.ts";
import { initGithubClientContext } from "./context/github.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(function* () {
    const denoDeploy = yield* initDenoDeploy();

    if (denoDeploy.isDenoDeploy) {
      patchDenoPermissionsQuerySync();
    }

    const token = Deno.env.get("GITHUB_TOKEN");
    if (!token) throw new Error(`GITHUB_TOKEN environment variable is missing`);
    
    yield* initGithubClientContext({
      token
    })

    let docs = yield* loadDocs();

    let library = yield* loadRepository({
      owner: "thefrontside",
      name: "effection"
    });

    let contrib = yield* loadRepository({
      owner: "thefrontside",
      name: "effection-contrib"
    })

    let revolution = createRevolution({
      app: [
        route("/", indexRoute()),
        route("/docs/:id", docsRoute(docs)),
        route("/contrib", contribIndexRoute(contrib)),
        route("/contrib/:workspace", contribPackageRoute()),
        route("/api/:symbol", apiVersionRoute()),
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
    console.log(`www -> ${urlFromServer(server)}`);

    yield* suspend();
  });
}

function urlFromServer(server: ServerInfo) {
  return new URL(
    "/",
    `http://${
      server.hostname === "0.0.0.0" ? "localhost" : server.hostname
    }:${server.port}`,
  );
}
