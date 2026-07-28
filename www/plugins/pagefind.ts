import { call, spawn, type Task } from "effection";
import type { RevolutionPlugin } from "revolution";

import { generate } from "../e4.ts";
import { exists } from "../lib/fs.ts";

/**
 * Build Effection's Pagefind search bundle on demand.
 *
 * Generation staticalizes the running site to index it, so it can only happen
 * while the server is up — not at plugin-factory time. This plugin builds the
 * bundle the first time `/pagefind/*` is requested and serves nothing itself;
 * the request then falls through to `pagefindRoute`, which serves the files and
 * advertises them in `sitemap.xml`.
 *
 * In development the first visit to search triggers the build. In CI a single
 * warmup request (see `www.yaml`) builds the bundle before the site is
 * staticalized, so the crawl sees a complete `/pagefind/` directory.
 *
 * The build is safe to run mid-crawl: while the bundle is absent `routemap`
 * reports nothing, so the generation pass never requests `/pagefind/*` and
 * cannot recurse into itself.
 */
export function pagefindPlugin(
  { pagefindDir, publicDir }: { pagefindDir: string; publicDir: string },
): RevolutionPlugin {
  let fsRoot = new URL(import.meta.resolve(`../${pagefindDir}`)).pathname;
  let generation: Task<unknown> | undefined;

  return {
    *http(request, next) {
      let { pathname } = new URL(request.url);
      if (
        (pathname === "/pagefind" || pathname.startsWith("/pagefind/")) &&
        !(yield* exists(fsRoot))
      ) {
        if (!generation) {
          let host = new URL(new URL(request.url).origin);
          generation = yield* spawn(() =>
            call(generate({
              host,
              publicDir,
              pagefindDir,
              rootSelector: "main",
            }))
          );
        }
        yield* generation;
      }
      return yield* next(request);
    },
  };
}
