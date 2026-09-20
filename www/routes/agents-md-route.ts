import type { Operation } from "effection";
import { until } from "effection";
import { fromFileUrl } from "@std/path";

import type { SitemapRoute } from "../plugins/sitemap.ts";

/**
 * Serve the repository's root `AGENTS.md`.
 *
 * `llms.txt` sends agents here for the behavioral contract, so the site hosts
 * it on the same origin as the documentation it describes rather than sending
 * them to GitHub. The file is read from the checkout on each request, which
 * keeps the repository root the only copy of it.
 */
export function agentsMdRoute(): SitemapRoute<Response> {
  // `.pathname` would yield `/C:/…` on Windows; `fromFileUrl` gives real paths.
  let path = fromFileUrl(import.meta.resolve("../../AGENTS.md"));

  return {
    *routemap(generate) {
      return [{ pathname: generate() }];
    },
    *handler(): Operation<Response> {
      let content = yield* until(Deno.readTextFile(path));

      return new Response(content, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    },
  };
}
