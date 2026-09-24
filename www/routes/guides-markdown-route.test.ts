import { describe, it } from "../testing.ts";
import { expect } from "expect";
import type { Operation } from "effection";
import { until } from "effection";
import { fromFileUrl } from "@std/path";

import { initConfig } from "../context/config.ts";
import { initGuides } from "../resources/guides.ts";
import { route, type SitemapExtension } from "../plugins/sitemap.ts";
import { guidesMarkdownRoute } from "./guides-markdown-route.ts";

const OPERATIONS = fromFileUrl(
  import.meta.resolve("../../docs/operations.mdx"),
);

let middleware = route("/guides/:series/:id.md", guidesMarkdownRoute());

function* get(url: string): Operation<Response> {
  return yield* middleware(new Request(url), function* (): Operation<Response> {
    throw new Error("the route handles the request itself");
  });
}

/**
 * Only the checked out series is on disk here; the dev server checks the
 * others out into worktrees, so limit the config to the one we have.
 */
function* onlyThisCheckout(): Operation<void> {
  yield* initConfig({ series: [{ name: "v4", major: 4 }], current: "v4" });
  yield* initGuides({ current: "v4", worktrees: [] });
}

describe("guidesMarkdownRoute", () => {
  it("serves a guide's markdown source", function* () {
    yield* onlyThisCheckout();

    let response = yield* get("http://localhost:8000/guides/v4/operations.md");

    expect(response.status).toEqual(200);
    expect(response.headers.get("Content-Type")).toEqual(
      "text/markdown; charset=utf-8",
    );
    expect(yield* until(response.text())).toEqual(
      yield* until(Deno.readTextFile(OPERATIONS)),
    );
  });

  it("does not invent a guide that is not there", function* () {
    yield* onlyThisCheckout();

    let response = yield* get("http://localhost:8000/guides/v4/nope.md");

    expect(response.status).toEqual(404);
  });

  it("lists every guide in the sitemap, so a static build captures them", function* () {
    yield* onlyThisCheckout();

    let paths = yield* (middleware as SitemapExtension).sitemapExtension!(
      new Request("http://localhost:8000/sitemap.xml"),
    );

    expect(paths).toContainEqual({ pathname: "/guides/v4/operations.md" });
    expect(paths).toContainEqual({ pathname: "/guides/v4/scope.md" });
    expect(paths.every((path) => path.pathname.endsWith(".md"))).toBe(true);
  });
});
