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
import { apiReferenceRoute } from "./routes/api-reference-route.tsx";
import { contribIndexRoute } from "./routes/contrib/index-route.tsx";
import { contribPackageRoute } from "./routes/contrib/package-route.tsx";

import { patchDenoPermissionsQuerySync } from "./deno-deploy-patch.ts";
import { loadDocs } from "./resources/docs.ts";
import { loadRepository } from "./resources/repository.ts";
import { initGithubClientContext } from "./context/github.ts";
import { initJSRClient } from "./context/jsr.ts";
import { apiIndexRoute } from "./routes/api-index-route.tsx";
import { apiMinorIndexRoute } from "./routes/api-minor-index-route.tsx";
import { apiMinorSymbolRoute } from "./routes/api-minor-symbol-route.tsx";
import {
  ContribRepositoryContext,
  LibraryRepositoryContext,
} from "./context/repository.ts";
import { previewRoute } from "./routes/preview-route.tsx";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(function* () {
    const denoDeploy = yield* initDenoDeploy();

    if (denoDeploy.isDenoDeploy) {
      patchDenoPermissionsQuerySync();
    }

    const jsrToken = Deno.env.get("JSR_API") ?? "";
    if (jsrToken === "") {
      console.log("Missing JSR API token; expect score card not to load.");
    }

    yield* initJSRClient({
      token: jsrToken,
    });

    const githubToken = Deno.env.get("GITHUB_TOKEN");
    if (!githubToken) {
      throw new Error(`GITHUB_TOKEN environment variable is missing`);
    }

    yield* initGithubClientContext({
      token: githubToken,
    });

    let library = yield* loadRepository({
      owner: "thefrontside",
      name: "effection",
    });
    yield* LibraryRepositoryContext.set(library);

    let contrib = yield* loadRepository({
      owner: "thefrontside",
      name: "effection-contrib",
    });
    yield* ContribRepositoryContext.set(contrib);

    let docs = yield* loadDocs({ repo: library, pattern: "effection-v3" });
    let docsV4 = yield* loadDocs({ repo: library, pattern: "effection-v4" });

    let revolution = createRevolution({
      app: [
        route("/", indexRoute()),
        route("/docs/v4/:id", docsRoute({ docs: docsV4, base: "/docs/v4/" })),
        route("/docs/:id", docsRoute({ docs, base: "/docs/" })),
        route("/contrib", contribIndexRoute(contrib)),
        route(
          "/contrib/:workspacePath",
          contribPackageRoute({ contrib, library }),
        ),
        route("/api", apiIndexRoute({ library })),
        route(
          "/api/v3/:symbol",
          apiReferenceRoute({ library, pattern: "effection-v3" }),
        ),
        route(
          "/api/v4/:symbol",
          apiReferenceRoute({ library, pattern: "effection-v4" }),
        ),
        route("/api/:minor", apiMinorIndexRoute({ library })),
        route("/api/:minor/:symbol", apiMinorSymbolRoute({ library })),
        route("/assets(.*)", assetsRoute("assets")),
        route("/preview", previewRoute({ library })),
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
