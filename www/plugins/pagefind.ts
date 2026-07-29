import { call, type Operation, spawn, type Task } from "effection";
import type { RevolutionPlugin } from "revolution";
import { fromFileUrl } from "@std/path";

import { exists } from "../lib/fs.ts";

/**
 * Build Effection's Pagefind search bundle on demand.
 *
 * Generation staticalizes the running site to index it, so it needs the server
 * up. Running that crawl inside the server process corrupts concurrent page
 * rendering, so this plugin shells out to `pagefind.ts` in a clean subprocess
 * and waits for it before falling through to `pagefindRoute`, which serves the
 * files. The first visit to search triggers the build in development; in CI a
 * warmup request (see `www.yaml`) builds it before the site is staticalized.
 *
 * Only the request that starts the build waits for it. The generator's crawl
 * follows `/search`'s `<script src="/pagefind/…">` and so re-requests
 * `/pagefind/*` while the build is still running — awaiting generation from
 * inside the crawl that is driving it would deadlock. Those re-entrant requests
 * fall through to a 404, which the non-strict crawl skips; the outer deploy
 * crawl only runs once the bundle exists and serves the real files.
 */
export function pagefindPlugin(
  { pagefindDir }: { pagefindDir: string },
): RevolutionPlugin {
  // `.pathname` would yield `/C:/…` on Windows; `fromFileUrl` gives real paths.
  let fsRoot = fromFileUrl(import.meta.resolve(`../${pagefindDir}`));
  let generatorPath = fromFileUrl(import.meta.resolve("../pagefind.ts"));
  let cwd = fromFileUrl(import.meta.resolve("../"));
  let generation: Task<unknown> | undefined;

  return {
    *http(request, next) {
      let { pathname } = new URL(request.url);
      let isPagefind = pathname === "/pagefind" ||
        pathname.startsWith("/pagefind/");

      if (isPagefind && !generation && !(yield* exists(fsRoot))) {
        generation = yield* spawn(function* (): Operation<void> {
          let command = new Deno.Command("deno", {
            args: ["run", "-A", generatorPath],
            cwd,
            stdout: "inherit",
            stderr: "inherit",
          });
          let { code } = yield* call(() => command.output());
          if (code !== 0) {
            throw new Error(`pagefind generation exited with code ${code}`);
          }
        });
        yield* generation;
      }

      return yield* next(request);
    },
  };
}
