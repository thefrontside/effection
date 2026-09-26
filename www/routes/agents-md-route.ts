import type { Operation } from "effection";
import { until } from "effection";
import { fromFileUrl } from "@std/path";

import type { SitemapRoute } from "../plugins/sitemap.ts";
import { useSiteUrl } from "../plugins/current-request.ts";
import { markdown } from "../lib/markdown-response.ts";

/**
 * The site's canonical url, as documents in the repository spell it. Links
 * that start with it are rewritten to the site serving them, the same way
 * `llms.txt` builds its links.
 */
const CANONICAL_SITE_URL = "https://frontside.com/effection";

/**
 * Matches the canonical url, but not a url that merely starts with it, so
 * that `https://frontside.com/effectionx` is left alone.
 */
const CANONICAL_LINK = new RegExp(
  `${CANONICAL_SITE_URL.replaceAll(".", "\\.")}(?=[/#?)\\s]|$)`,
  "g",
);

/**
 * Serve the Effection behavioral contract that `llms.txt` sends agents to.
 *
 * `docs/agents.md` is the only copy: the file is read from the checkout on
 * each request rather than duplicated here, and the root `AGENTS.md` points at
 * that same file for anyone working in the repository.
 *
 * Its links to the documentation and the API reference are written as
 * canonical urls, so a preview or a dev server rewrites them to itself and an
 * agent reading them stays on the site it came from. Urls elsewhere, such as
 * the Frontside blog, are left as they are.
 */
export function agentsMdRoute(): SitemapRoute<Response> {
  // `.pathname` would yield `/C:/…` on Windows; `fromFileUrl` gives real paths.
  let path = fromFileUrl(import.meta.resolve("../../docs/agents.md"));

  return {
    *routemap(generate) {
      return [{ pathname: generate() }];
    },
    *handler(): Operation<Response> {
      let url = yield* useSiteUrl();
      let source = yield* until(Deno.readTextFile(path));

      return markdown(rewriteSiteLinks(source, url));
    },
  };
}

export function rewriteSiteLinks(
  content: string,
  url: (path: string) => string,
): string {
  // `url("/")` ends in the slash that each canonical link already carries
  let site = url("/").replace(/\/$/, "");

  return content.replaceAll(CANONICAL_LINK, site);
}
