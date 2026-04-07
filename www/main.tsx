import { main, suspend } from "effection";
import { createRevolution, ServerInfo } from "revolution";

import { etagPlugin } from "./plugins/etag.ts";
import { route, sitemapPlugin } from "./plugins/sitemap.ts";
import { inlineSvgPlugin } from "./plugins/inline-svg.ts";
import { tailwindPlugin } from "./plugins/tailwind.ts";

import { apiReferenceRoute } from "./routes/api-reference-route.tsx";
import { assetsRoute } from "./routes/assets-route.ts";
import { firstPage, guidesRoute } from "./routes/guides-route.tsx";
import { indexRoute } from "./routes/index-route.tsx";
import { xIndexRedirect, xIndexRoute } from "./routes/x-index-route.tsx";
import { xPackageRedirect, xPackageRoute } from "./routes/x-package-route.tsx";

import { useConfig } from "./context/config.ts";
import { initFetch } from "./context/fetch.ts";
import { initJSRClient } from "./context/jsr.ts";
import { initWorktrees } from "./lib/worktrees.ts";
import { initGuides } from "./resources/guides.ts";
import { initBlog } from "./resources/blog.ts";
import { initFonts } from "./resources/fonts.ts";
import { initImageStore } from "./resources/image-store.ts";
import { apiIndexRoute } from "./routes/api-index-route.tsx";
import { blogIndexRoute } from "./routes/blog-index-route.tsx";
import { blogPostRoute } from "./routes/blog-post-route.tsx";
import { blogImageRoute } from "./routes/blog-image-route.ts";
import { blogTagRoute } from "./routes/blog-tag-route.tsx";
import { blogFeedRoute } from "./routes/blog-feed-route.tsx";
import { llmsTxtRoute } from "./routes/llms-txt-route.ts";
import { pagefindRoute } from "./routes/pagefind-route.ts";
import { redirectDocsRoute } from "./routes/redirect-docs-route.tsx";
import { redirectIndexRoute } from "./routes/redirect-index-route.tsx";
import { searchRoute } from "./routes/search-route.tsx";
import { initClones } from "./lib/clones.ts";
import { initOctokitContext } from "./lib/octokit.ts";
import { currentRequestPlugin } from "./plugins/current-request.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(function* () {
    let { current, series } = yield* useConfig();

    // Get stable series (no prereleases) for guides
    let stableSeries = series.filter((s) => !s.includePrerelease);

    yield* initClones("build/clones");
    yield* initWorktrees("build/worktrees");
    yield* initGuides({
      current,
      worktrees: stableSeries
        .filter((s) => s.name !== current)
        .map((s) => s.name),
    });

    yield* initBlog();
    yield* initFonts();
    yield* initImageStore();

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
        // Guides only for stable series (no prereleases)
        ...stableSeries.map((s) =>
          route(`/guides/${s.name}`, redirectIndexRoute(firstPage(s.name)))
        ),
        route("/guides/:series/:id", guidesRoute({ search: true })),
        route("/contrib", xIndexRedirect()),
        route("/contrib/:workspacePath", xPackageRedirect()),
        route("/x", xIndexRoute({ search: true })),
        route("/x/:workspacePath", xPackageRoute({ search: true })),
        route("/api", apiIndexRoute({ search: true })),
        // API docs for all series including prereleases
        ...series.map((s) =>
          route(
            `/api/${s.name}/:symbol`,
            apiReferenceRoute(s.name, { search: true }),
          )
        ),
        route("/blog", blogIndexRoute({ search: true })),
        route("/blog/feed.xml", blogFeedRoute()),
        route("/llms.txt", llmsTxtRoute()),
        route("/blog/tags/:tag", blogTagRoute({ search: true })),
        route("/blog/:id", blogPostRoute({ search: true })),
        route("/blog/:id/:name.png", blogImageRoute()),
        route("/blog{/*path}", assetsRoute("blog")),
        route(
          "/pagefind{/*path}",
          pagefindRoute({ pagefindDir: "pagefind", publicDir: "./built/" }),
        ),
        route("/assets/*path", assetsRoute("assets")),
      ],
      plugins: [
        yield* tailwindPlugin({ input: "main.css", outdir: "tailwind" }),
        inlineSvgPlugin({
          basedir: new URL(".", import.meta.url).pathname,
        }),
        currentRequestPlugin(),
        etagPlugin(),
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
