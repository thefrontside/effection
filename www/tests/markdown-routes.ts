import { assertEquals, assertMatch, assertStringIncludes } from "@std/assert";

/**
 * Smoke tests for the markdown the site serves to agents.
 *
 * These run against a site that is already serving, because the documents come
 * from checkouts and generated API docs rather than from fixtures:
 *
 *     deno task dev            # in one terminal
 *     deno task smoke          # in another
 *
 * `SMOKE_URL` points them at a different site, which is how the workflow runs
 * them against the server it starts before a static build.
 *
 * The file is deliberately not named `*.test.ts`: `deno task test` would
 * otherwise pick it up and fail, since there is no server to talk to.
 */
const SITE = Deno.env.get("SMOKE_URL") ?? "http://localhost:8000";

async function get(path: string): Promise<[Response, string]> {
  // `SITE` is where the documents are fetched from; the urls inside them
  // belong to whatever the site is configured to advertise, which in a preview
  // build is not the address the tests are talking to
  let response = await fetch(new URL(path, SITE));
  return [response, await response.text()];
}

function markdown(response: Response) {
  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("Content-Type"),
    "text/markdown; charset=utf-8",
  );
}

Deno.test("/AGENTS.md serves the behavioral contract", async () => {
  let [response, body] = await get("/AGENTS.md");

  markdown(response);
  assertStringIncludes(body, "## Core invariants (do not violate)");
  assertStringIncludes(body, "## `ensure()`");
  // the repository's own rules stay in the repository
  assertEquals(body.includes("## Pre-commit workflow"), false);
  // and its links lead to the site rather than to github
  assertMatch(body, /consult the API reference:\nhttps?:\/\/\S+\/api\//);
  assertEquals(body.includes("raw.githubusercontent.com"), false);
});

Deno.test("/llms.txt leads to markdown, not to github", async () => {
  let [response, body] = await get("/llms.txt");

  // the urls themselves belong to whichever site is serving, so match shape
  assertEquals(response.status, 200);
  assertMatch(body, /^\[AGENTS\.md\]: https?:\/\/\S+\/AGENTS\.md$/m);
  assertMatch(body, /^\[API\]: https?:\/\/\S+\/api\.md$/m);
  assertMatch(
    body,
    /^\[Operations\]: https?:\/\/\S+\/guides\/v4\/operations\.md$/m,
  );
  assertMatch(
    body,
    /^- \[@effectionx\/task-buffer\]\(https?:\/\/\S+\/x\/task-buffer\.md\)/m,
  );
  assertEquals(body.includes("github.com"), false);
});

Deno.test("/guides/:series/:id.md serves a guide's source", async () => {
  let [response, body] = await get("/guides/v4/operations.md");

  markdown(response);
  assertStringIncludes(body, "## Stateless");
});

Deno.test("/x/:package.md serves a readme that says how to install it", async () => {
  let [response, body] = await get("/x/task-buffer.md");

  markdown(response);
  assertStringIncludes(body, "# Task Buffer");
  // exactly once: the readmes that already say it are left alone
  assertEquals(body.split("npm install @effectionx/task-buffer").length - 1, 1);
});

Deno.test("/api.md indexes the symbols, /api/:series/:symbol.md documents one", async () => {
  let [index, list] = await get("/api.md");

  markdown(index);
  assertStringIncludes(list, "# API Reference");
  assertMatch(list, /^- \[main\]\(https?:\/\/\S+\/api\/v4\/main\.md\)$/m);

  let [symbol, page] = await get("/api/v4/main.md");

  markdown(symbol);
  assertStringIncludes(page, "# main");
  assertMatch(page, /```ts\n.*function main/);
});

Deno.test("an unknown symbol is not found rather than a crash", async () => {
  let [response] = await get("/api/v4/does-not-exist.md");

  assertEquals(response.status, 404);
});

Deno.test("the pages these documents come from still render", async () => {
  for (
    let path of [
      "/api",
      "/api/v4/main",
      "/guides/v4/operations",
      "/x/task-buffer",
    ]
  ) {
    let [response] = await get(path);

    assertEquals(response.status, 200, `${path} responded ${response.status}`);
    assertStringIncludes(
      response.headers.get("Content-Type") ?? "",
      "text/html",
    );
  }
});
