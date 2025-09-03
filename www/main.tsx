import { main, suspend } from "effection";
import { initDenoDeploy } from "@effectionx/deno-deploy";
import { createRevolution, ServerInfo } from "revolution";

import { etagPlugin } from "./plugins/etag.ts";
import { rebasePlugin } from "./plugins/rebase.ts";
import { route, sitemapPlugin } from "./plugins/sitemap.ts";
import { tailwindPlugin } from "./plugins/tailwind.ts";

import { apiReferenceRoute } from "./routes/api-reference-route.tsx";
import { assetsRoute } from "./routes/assets-route.ts";
import { xIndexRedirect, xIndexRoute } from "./routes/x-index-route.tsx";
import { xPackageRedirect, xPackageRoute } from "./routes/x-package-route.tsx";
import { firstPage, guidesRoute } from "./routes/guides-route.tsx";
import { indexRoute } from "./routes/index-route.tsx";

import { initOctokitContext } from "./repository/octokit-context.ts";
import { initJSRClient } from "./context/jsr.ts";
import { patchDenoPermissionsQuerySync } from "./deno-deploy-patch.ts";
import { apiIndexRoute } from "./routes/api-index-route.tsx";
import { apiMinorIndexRoute } from "./routes/api-minor-index-route.tsx";
import { apiMinorSymbolRoute } from "./routes/api-minor-symbol-route.tsx";
import { pagefindRoute } from "./routes/pagefind-route.ts";
import { previewApiRoute } from "./routes/preview-api-route.tsx";
import { previewRoute } from "./routes/preview-route.tsx";
import { redirectDocsRoute } from "./routes/redirect-docs-route.tsx";
import { redirectIndexRoute } from "./routes/redirect-index-route.tsx";
import { searchRoute } from "./routes/search-route.tsx";
import { initFetch } from "./context/fetch.ts";
import { initGitRepositoryProvider, useRepository } from "./repository/api.ts";
import { initGithubBlobFetchMiddleware, rewriteContentsApiToGit } from "./repository/middleware.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(function* () {
    const denoDeploy = yield* initDenoDeploy();

    if (denoDeploy.isDenoDeploy) {
      patchDenoPermissionsQuerySync();
    }

    yield* initJSRClient();
    yield* initFetch();

    yield* initOctokitContext();
    yield* initGitRepositoryProvider();

    let library = yield* useRepository({
      owner: "thefrontside",
      name: "effection",
    });

    let x = yield* useRepository({
      owner: "thefrontside",
      name: "effectionx",
    });

    yield* rewriteContentsApiToGit(({ owner, repo }) =>
      owner === "thefrontside" && ["effectionx", "effection"].includes(repo)
    );

    yield* initGithubBlobFetchMiddleware();
    

    let revolution = createRevolution({
      app: [
        route("/", indexRoute()),
        route("/search", searchRoute()),
        route(
          "/docs",
          redirectIndexRoute(firstPage({ repository: library, series: "v3" })),
        ),
        route(
          "/docs/:id",
          redirectDocsRoute({ repository: library, series: "v3" }),
        ),
        route(
          "/guides/v3",
          redirectIndexRoute(firstPage({ repository: library, series: "v3" })),
        ),
        route(
          "/guides/v4",
          redirectIndexRoute(firstPage({ repository: library, series: "v4" })),
        ),
        route(
          "/guides/:series/:id",
          guidesRoute({ repository: library, search: true }),
        ),
        route("/contrib", xIndexRedirect()),
        route("/contrib/:workspacePath", xPackageRedirect({ x })),
        route("/x", xIndexRoute({ x, search: true })),
        route("/x/:workspacePath", xPackageRoute({ x, library, search: true })),
        route("/api", apiIndexRoute({ library, search: true })),
        route(
          "/api/v3/:symbol",
          apiReferenceRoute({ library, pattern: "effection-v3", search: true }),
        ),
        route(
          "/api/v4/:symbol",
          apiReferenceRoute({
            library,
            pattern: "effection-v4",
            search: true,
          }),
        ),
        route("/api/:minor", apiMinorIndexRoute({ library, search: false })),
        route(
          "/api/:minor/:symbol",
          apiMinorSymbolRoute({ library, search: false }),
        ),
        route(
          "/pagefind{/*path}",
          pagefindRoute({ pagefindDir: "pagefind", publicDir: "./built/" }),
        ),
        route("/assets{/*path}", assetsRoute("assets")),
        route("/preview", previewRoute({ library })),
        route("/preview/api/:symbol", previewApiRoute({ library })),
      ],
      plugins: [
        yield* tailwindPlugin({ input: "main.css", outdir: "tailwind" }),
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
