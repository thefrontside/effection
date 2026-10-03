import { main, type Operation, resource, suspend } from "effection";
import { parse, printErrors, printHelp } from "@frontside/configliere";
import { createRevolution, ServerInfo } from "revolution";

import { type Options, www } from "./cli.ts";

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
import { guidesMarkdownRoute } from "./routes/guides-markdown-route.ts";
import { xPackageMarkdownRoute } from "./routes/x-package-markdown-route.ts";
import {
  apiIndexMarkdownRoute,
  apiSymbolMarkdownRoute,
} from "./routes/api-markdown-route.ts";
import { agentsMdRoute } from "./routes/agents-md-route.ts";
import { currentRequestPlugin } from "./plugins/current-request.ts";
import { verboseLogging } from "./context/logging.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  let intent = parse(www, {
    argv: Deno.args,
    envs: [{ name: "environment", value: Deno.env.toObject() }],
  });

  if (!intent.ok) {
    console.error(printErrors(intent));
    // No Effection scope exists yet, so there is nothing to unwind.
    Deno.exit(1);
  } else if (intent.method === "help") {
    console.log(printHelp(intent));
  } else {
    await main(() => serve(intent.model));
  }
}

/**
 * The running site, as a resource: everything it needs is set up before it is
 * provided, and the server shuts down when the enclosing scope exits.
 *
 * `main.tsx` keeps it running until the process ends; a test holds it for the
 * length of a suite and lets its scope close.
 */
export function useSite(options: Options): Operation<ServerInfo> {
  return resource(function* (provide) {
    yield* verboseLogging(options.verbose);

    let { current, series } = yield* useConfig();

    // Get stable series (no prereleases) for guides
    let stableSeries = series.filter((s) => !s.includePrerelease);

    yield* initClones(options.clonesDir, {
      checkouts: localCheckouts(options.effectionxDir),
    });
    yield* initWorktrees(options.worktreesDir);
    yield* initGuides({
      current,
      worktrees: stableSeries
        .filter((s) => s.name !== current)
        .map((s) => s.name),
    });

    yield* initBlog();
    yield* initFonts();
    yield* initImageStore();

    yield* initJSRClient(options.jsrApi);
    yield* initFetch();

    // configures Octokit client
    yield* initOctokitContext(options.githubToken);

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
        // before the page route, so that `.md` is a suffix and not a guide id
        route("/guides/:series/:id.md", guidesMarkdownRoute()),
        route("/guides/:series/:id", guidesRoute({ search: true })),
        route("/contrib", xIndexRedirect()),
        route("/contrib/:workspacePath", xPackageRedirect()),
        route("/x", xIndexRoute({ search: true })),
        // before the page route, so that `.md` is a suffix and not a package
        route("/x/:workspacePath.md", xPackageMarkdownRoute()),
        route("/x/:workspacePath", xPackageRoute({ search: true })),
        route("/api", apiIndexRoute({ search: true })),
        // before the page routes, so that `.md` is a suffix and not a symbol
        route("/api.md", apiIndexMarkdownRoute()),
        ...series.map((s) =>
          route(`/api/${s.name}/:symbol.md`, apiSymbolMarkdownRoute(s.name))
        ),
        ...series.map((s) =>
          route(
            `/api/${s.name}/experimental/:symbol.md`,
            apiSymbolMarkdownRoute(s.name, { entrypoint: "./experimental" }),
          )
        ),
        // API docs for all series including prereleases
        ...series.map((s) =>
          route(
            `/api/${s.name}/:symbol`,
            apiReferenceRoute(s.name, { search: true }),
          )
        ),
        // Experimental API docs (namespaced; empty for series without the
        // `./experimental` entrypoint)
        ...series.map((s) =>
          route(
            `/api/${s.name}/experimental/:symbol`,
            apiReferenceRoute(s.name, {
              search: true,
              entrypoint: "./experimental",
            }),
          )
        ),
        route("/blog", blogIndexRoute({ search: true })),
        route("/blog/feed.xml", blogFeedRoute()),
        route("/llms.txt", llmsTxtRoute()),
        route("/AGENTS.md", agentsMdRoute()),
        route("/blog/tags/:tag", blogTagRoute({ search: true })),
        route("/blog/:id", blogPostRoute({ search: true })),
        route("/blog/:id/:name.png", blogImageRoute()),
        route("/blog{/*path}", assetsRoute("blog")),
        route(
          "/pagefind{/*path}",
          pagefindRoute({ pagefindDir: options.pagefindDir }),
        ),
        route("/assets/*path", assetsRoute("assets")),
      ],
      plugins: [
        yield* tailwindPlugin({
          input: options.tailwindInput,
          outdir: options.tailwindOutdir,
        }),
        inlineSvgPlugin({
          basedir: new URL(".", import.meta.url).pathname,
        }),
        currentRequestPlugin(),
        yield* etagPlugin({ deploymentId: options.denoDeploymentId }),
        sitemapPlugin(),
      ],
    });

    yield* provide(yield* revolution.start({ port: options.port }));
  });
}

function* serve(options: Options) {
  let server = yield* useSite(options);

  console.log(`www -> ${urlFromServer(server)}`);

  yield* suspend();
}

/**
 * Checkouts to use instead of cloning from GitHub, so that a repository you
 * are working in shows up on the site:
 *
 * ```
 * EFFECTIONX_DIR=../effectionx deno task dev
 * ```
 */
function localCheckouts(effectionx: string): Record<string, string> {
  return effectionx ? { "thefrontside/effectionx": effectionx } : {};
}

function urlFromServer(server: ServerInfo) {
  return new URL(
    "/",
    `http://${
      server.hostname === "0.0.0.0" ? "localhost" : server.hostname
    }:${server.port}`,
  );
}
