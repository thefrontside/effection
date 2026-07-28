import { call, type Operation, spawn, type Task } from "effection";
import { GET } from "revolution";
import { relative } from "@std/path";

import { assetsRoute } from "./assets-route.ts";
import { generate } from "../e4.ts";
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
 * Building the bundle is a separate step (`deno task pagefind`, see
 * `pagefind.ts`) that runs before the site is staticalized. `routemap` only
 * reports files that already exist on disk and never triggers generation — the
 * generation pass staticalizes the site itself, so generating here would
 * recurse.
 */
export function pagefindRoute(
  { pagefindDir, publicDir }: { pagefindDir: string; publicDir: string },
): SitemapRoute<Response> {
  let assets = assetsRoute(pagefindDir);
  let fsRoot = new URL(import.meta.resolve(`../${pagefindDir}`)).pathname;
  let generation: Task<unknown> | undefined;

  let handler = GET<Response>(function* (request, next) {
    // In CI the bundle is generated up front by `deno task pagefind`; here we
    // build it on demand so that `deno task dev` just works.
    if (!(yield* exists(fsRoot))) {
      if (!generation) {
        let host = new URL(new URL(request.url).origin);
        generation = yield* spawn(() =>
          call(generate({ host, publicDir, pagefindDir, rootSelector: "main" }))
        );
      }
      yield* generation;
    }
    return yield* assets(request, next);
  });

  return {
    handler,
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
