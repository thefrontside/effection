import { assertEquals } from "@std/assert";
import { run, until } from "effection";
import { ensureFile } from "@std/fs";

import { pagefindRoute } from "./pagefind-route.ts";
import type { RoutePath } from "../plugins/sitemap.ts";

// The fixture lives next to the route so it resolves the same way the real
// `pagefind` dir does (`import.meta.resolve("../<pagefindDir>")`).
let fixtureDir = "__pagefind_test__";
let fixtureRoot = new URL(import.meta.resolve(`../${fixtureDir}`)).pathname;

function pathnames(): Promise<string[]> {
  return run(function* () {
    let route = pagefindRoute({
      pagefindDir: fixtureDir,
      publicDir: "./pagefind-site/",
    });
    let paths = (yield* route.routemap!(
      () => "/pagefind/",
      new Request("http://localhost/sitemap.xml"),
    )) as RoutePath[];
    return paths.map((path) => path.pathname);
  });
}

Deno.test("routemap advertises every file in the pagefind bundle", async () => {
  try {
    await run(function* () {
      for (
        let path of [
          "pagefind.js",
          "pagefind-entry.json",
          "wasm.unknown.pagefind",
          "fragment/en_0001.pf_fragment",
          "index/en_0001.pf_index",
        ]
      ) {
        yield* until(ensureFile(`${fixtureRoot}/${path}`));
      }
    });

    assertEquals(await pathnames(), [
      "/pagefind/fragment/en_0001.pf_fragment",
      "/pagefind/index/en_0001.pf_index",
      "/pagefind/pagefind-entry.json",
      "/pagefind/pagefind.js",
      "/pagefind/wasm.unknown.pagefind",
    ]);
  } finally {
    await Deno.remove(fixtureRoot, { recursive: true }).catch(() => {});
  }
});

Deno.test("routemap advertises nothing when the bundle is absent", async () => {
  await Deno.remove(fixtureRoot, { recursive: true }).catch(() => {});
  assertEquals(await pathnames(), []);
});
