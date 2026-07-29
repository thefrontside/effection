import { call, type Operation, spawn, type Task } from "effection";
import { exec } from "@effectionx/process";
import { fromFileUrl } from "@std/path";

import { assetsRoute } from "./assets-route.ts";
import { exists } from "../lib/fs.ts";
import type { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";

/**
 * Serve Effection's Pagefind search bundle and include every file in it
 * in the `sitemap.xml` file, so Staticalize captures the whole bundle in its normal
 * crawl.
 */
export function pagefindRoute(
  { pagefindDir }: { pagefindDir: string },
): SitemapRoute<Response> {
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
        generation = yield* spawn(() =>
          exec(`deno run -A ${generatorPath}`, { cwd }).expect()
        );
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
