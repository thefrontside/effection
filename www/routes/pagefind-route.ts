import { call, type Operation, spawn, type Task } from "effection";
import { fromFileUrl } from "@std/path";

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
 * its own sitemap entry and Staticalize downloads each one directly. This works
 * the same way below `/effection/` on frontside.com: its proxy re-prefixes
 * these sitemap entries and crawls them.
 *
 * Requesting the sitemap builds the bundle if it's missing: `routemap` shells
 * out to `pagefind.ts` (a subprocess, because generation staticalizes this
 * running site and doing that crawl in-process corrupts page rendering), waits
 * for it, then enumerates the files. Generation's own crawl re-requests
 * `/sitemap.xml`, so while a build is in flight `routemap` returns nothing and
 * does not await it — awaiting the build from inside the crawl driving it would
 * deadlock.
 */
export function pagefindRoute(
  { pagefindDir }: { pagefindDir: string },
): SitemapRoute<Response> {
  // `.pathname` would yield `/C:/…` on Windows; `fromFileUrl` gives real paths.
  let fsRoot = fromFileUrl(import.meta.resolve(`../${pagefindDir}`));
  let generatorPath = fromFileUrl(import.meta.resolve("../pagefind.ts"));
  let cwd = fromFileUrl(import.meta.resolve("../"));
  let generation: Task<unknown> | undefined;

  return {
    handler: assetsRoute(pagefindDir),
    *routemap(): Operation<RoutePath[]> {
      if (!(yield* exists(fsRoot))) {
        if (generation) {
          return [];
        }
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
