import { call, type Operation, spawn, type Task } from "effection";
import { exec } from "@effectionx/process";
import { fromFileUrl } from "@std/path";

import { assetsRoute } from "./assets-route.ts";
import { exists } from "../lib/fs.ts";
import type { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";

const STATICALIZE = "jsr:@frontside/staticalize@0.2.7/cli";
const PAGEFIND = "npm:pagefind@1.5.2";

/**
 * Serve Effection's Pagefind search bundle and include every file in it in
 * `sitemap.xml`, so Staticalize captures the whole bundle in its normal crawl.
 *
 * Requesting the sitemap builds the bundle if it's missing: `routemap`
 * staticalizes this running site to a throwaway directory (Pagefind indexes
 * static HTML, and none exists yet at crawl time) and indexes it with the
 * Pagefind CLI. Generation's own crawl re-requests `/sitemap.xml`, so while a
 * build is in flight `routemap` returns nothing and does not await it —
 * awaiting the build from inside the crawl driving it would deadlock.
 *
 * The staticalize crawl uses `.join()` rather than `.expect()`: the CLI exits
 * non-zero if any single page fails, and a handful of API-doc pages have
 * unresolved references that don't render. We tolerate those and index whatever
 * crawled successfully; the Pagefind step (`.expect()`) is the real gate.
 */
export function pagefindRoute(
  { pagefindDir }: { pagefindDir: string },
): SitemapRoute<Response> {
  // `.pathname` would yield `/C:/…` on Windows; `fromFileUrl` gives real paths.
  let fsRoot = fromFileUrl(import.meta.resolve(`../${pagefindDir}`));
  let siteDir = fromFileUrl(import.meta.resolve("../pagefind-site"));
  let generation: Task<unknown> | undefined;

  return {
    handler: assetsRoute(pagefindDir),
    *routemap(_generate, request): Operation<RoutePath[]> {
      if (!(yield* exists(fsRoot))) {
        if (generation) {
          return [];
        }
        let { origin } = new URL(request.url);
        generation = yield* spawn(function* () {
          yield* exec(
            `deno run -A ${STATICALIZE} --site ${origin} --base ${origin} --output ${siteDir} --concurrency 10 --retries 5`,
          ).join();
          yield* exec(
            `deno run -A ${PAGEFIND} --site ${siteDir} --output-path ${fsRoot}`,
          ).expect();
        });
        yield* generation;
      }

      let files = yield* collectFiles(fsRoot);
      // collectFiles builds paths as `${fsRoot}/…` with forward slashes, so
      // strip the prefix directly rather than using @std/path's `relative`,
      // which would yield backslash-separated (and thus wrong) URLs on Windows.
      return files
        .map((file) => file.slice(fsRoot.length + 1))
        .sort()
        .map((path) => ({
          pathname: `/pagefind/${
            path.split("/").map(encodeURIComponent).join("/")
          }`,
        }));
    },
  };
}

function* collectFiles(dir: string): Operation<string[]> {
  let files: string[] = [];
  let entries = yield* call(() => Array.fromAsync(Deno.readDir(dir)));

  for (let entry of entries) {
    let path = `${dir}/${entry.name}`;

    if (entry.isDirectory) {
      files.push(...yield* collectFiles(path));
    } else if (entry.isFile) {
      files.push(path);
    }
  }

  return files;
}
