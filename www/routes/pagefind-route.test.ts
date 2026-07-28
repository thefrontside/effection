import { assertEquals } from "@std/assert";
import { run } from "effection";

import { pagefindRoute } from "./pagefind-route.ts";
import type { RoutePath } from "../plugins/sitemap.ts";

function pathnames(pagefindDir: string): Promise<string[]> {
  return run(function* () {
    let route = pagefindRoute({ pagefindDir });
    let paths = (yield* route.routemap!(
      () => "/pagefind/",
      new Request("http://localhost/sitemap.xml"),
    )) as RoutePath[];
    return paths.map((path) => path.pathname);
  });
}

Deno.test("routemap advertises every file in the pagefind bundle", async () => {
  // test-fixtures/search-bundle stands in for a built `pagefind` directory.
  assertEquals(await pathnames("test-fixtures/search-bundle"), [
    "/pagefind/fragment/en_0001.pf_fragment",
    "/pagefind/index/en_0001.pf_index",
    "/pagefind/wasm.unknown.pagefind",
  ]);
});

Deno.test("routemap advertises nothing when the bundle is absent", async () => {
  assertEquals(await pathnames("test-fixtures/does-not-exist"), []);
});
