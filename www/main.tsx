import { main, suspend } from "effection";
import { createRevolution, ServerInfo } from "revolution";

import { etagPlugin } from "./plugins/etag.ts";
import { rebasePlugin } from "./plugins/rebase.ts";
import { route, sitemapPlugin } from "./plugins/sitemap.ts";
import { tailwindPlugin } from "./plugins/tailwind.ts";

import { apiReferenceRoute } from "./routes/api-reference-route.tsx";
import { assetsRoute } from "./routes/assets-route.ts";
import { firstPage, guidesRoute } from "./routes/guides-route.tsx";
import { indexRoute } from "./routes/index-route.tsx";
import { xIndexRedirect, xIndexRoute } from "./routes/x-index-route.tsx";
import { xPackageRedirect, xPackageRoute } from "./routes/x-package-route.tsx";

import { initConfig, useConfig } from "./context/config.ts";
import { initFetch } from "./context/fetch.ts";
import { initJSRClient } from "./context/jsr.ts";
import { initWorktrees } from "./lib/worktrees.ts";
import { initGuides } from "./resources/guides.ts";
import { apiIndexRoute } from "./routes/api-index-route.tsx";
import { pagefindRoute } from "./routes/pagefind-route.ts";
import { redirectDocsRoute } from "./routes/redirect-docs-route.tsx";
import { redirectIndexRoute } from "./routes/redirect-index-route.tsx";
import { searchRoute } from "./routes/search-route.tsx";
import { initClones } from "./lib/clones.ts";
import { initOctokitContext } from "./lib/octokit.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(function* () {
    const { current, series } = yield* useConfig();

    yield* initClones("build/clones");
    yield* initWorktrees("build/worktrees");
    yield* initGuides({
      current,
      worktrees: series.filter((s) => s !== current),
    });

    yield* initJSRClient();
    yield* initFetch();

    // configures Octokit client
    yield* initOctokitContext();

    let revolution = createRevolution({
      app: [
        route("/", indexRoute()),
        route("/search", searchRoute()),
        route("/docs", redirectIndexRoute(firstPage(current))),
        route("/docs/:id", redirectDocsRoute(current)),
        ...series.map((s) =>
          route(`/guides/${s}`, redirectIndexRoute(firstPage(s))),
        ),
        route("/guides/:series/:id", guidesRoute({ search: true })),
        route("/contrib", xIndexRedirect()),
        route("/contrib/:workspacePath", xPackageRedirect()),
        route("/x", xIndexRoute({ search: true })),
        route("/x/:workspacePath", xPackageRoute({ search: true })),
        route("/api", apiIndexRoute({ search: true })),
        ...series.map((s) =>
          route(`/api/${s}/:symbol`, apiReferenceRoute(s, { search: true })),
        ),
        route(
          "/pagefind{/*path}",
          pagefindRoute({ pagefindDir: "pagefind", publicDir: "./built/" }),
        ),
        route("/assets/*path", assetsRoute("assets")),
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
