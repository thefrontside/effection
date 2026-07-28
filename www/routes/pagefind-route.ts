import { call, type Operation } from "effection";
import { relative } from "@std/path";

import { assetsRoute } from "./assets-route.ts";
import { exists } from "../lib/fs.ts";
import type { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";

/**
 * Serve Effection's Pagefind search bundle and advertise every file in it
 * through `sitemap.xml`, so Staticalize captures the whole bundle in its normal
 * crawl.
 *
 * Pagefind's runtime, manifest, WebAssembly, and index fragments are fetched
 * dynamically by the browser — they are never linked from a page, and
 * Staticalize only downloads sitemap URLs plus `link[href]`/`[src]` assets (it
 * does not follow `<a href>` links). So `routemap` lists each bundle file as
 * its own sitemap entry, and Staticalize downloads each one directly. This
 * works the same way when the site is mounted below `/effection/` on
 * frontside.com: its proxy re-prefixes these sitemap entries and crawls them.
 *
 * Building the bundle is owned by `pagefindPlugin`; this route only serves and
 * advertises what already exists on disk. `routemap` reports nothing while the
 * bundle is absent, so the generation pass never requests `/pagefind/*` and
 * cannot recurse.
 */
export function pagefindRoute(
  { pagefindDir }: { pagefindDir: string },
): SitemapRoute<Response> {
  let fsRoot = new URL(import.meta.resolve(`../${pagefindDir}`)).pathname;

  return {
    handler: assetsRoute(pagefindDir),
    *routemap(): Operation<RoutePath[]> {
      if (!(yield* exists(fsRoot))) {
        return [];
      }
      let files = yield* collectFiles(fsRoot);
      return files
        .map((file) => relative(fsRoot, file))
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
