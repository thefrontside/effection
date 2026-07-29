import { call, type Operation, spawn, type Task } from "effection";
import type { RevolutionPlugin } from "revolution";
import { fromFileUrl } from "@std/path";

import { exists } from "../lib/fs.ts";

/**
 * Build Effection's Pagefind search bundle on demand.
 *
 * Generation staticalizes the running site to index it, so it needs the server
 * up. Rather than run that crawl inside the server process — which corrupts
 * concurrent page rendering — this plugin shells out to `pagefind.ts` in a
 * clean subprocess and waits for it. The request then falls through to
 * `pagefindRoute`, which serves the files and advertises them in `sitemap.xml`.
 *
 * In development the first visit to search triggers the build. In CI a single
 * warmup request (see `www.yaml`) builds the bundle before the site is
 * staticalized.
 *
 * The generator's crawl follows `/search`'s `<script src="/pagefind/…">`, so it
 * re-requests `/pagefind/*` while the build is still running. Those requests
 * get a transient empty `200` (a stub) so the crawl never blocks on the build
 * it is itself driving — a real deadlock otherwise. Once the build finishes the
 * bundle exists on disk and every request serves the real file.
 */
export function pagefindPlugin(
  { pagefindDir }: { pagefindDir: string },
): RevolutionPlugin {
  // `.pathname` would yield `/C:/…` on Windows; `fromFileUrl` gives real paths.
  let fsRoot = fromFileUrl(import.meta.resolve(`../${pagefindDir}`));
  let generatorPath = fromFileUrl(import.meta.resolve("../pagefind.ts"));
  let cwd = fromFileUrl(import.meta.resolve("../"));
  let generating = false;
  let generation: Task<unknown> | undefined;

  return {
    *http(request, next) {
      let { pathname } = new URL(request.url);
      if (pathname !== "/pagefind" && !pathname.startsWith("/pagefind/")) {
        return yield* next(request);
      }
      if (yield* exists(fsRoot)) {
        return yield* next(request);
      }
      if (generating) {
        return new Response("", { status: 200 });
      }
      generating = true;
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
      return yield* next(request);
    },
  };
}
