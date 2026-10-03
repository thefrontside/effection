import { assertEquals, assertMatch, assertStringIncludes } from "@std/assert";
import { beforeAll, describe, it } from "@effectionx/bdd";
import { fetch, type FetchResponse } from "@effectionx/fetch";
import { parse } from "@frontside/configliere";

import { useSite } from "../main.tsx";
import { www } from "../cli.ts";

/**
 * Smoke tests for the markdown the site serves to agents.
 *
 * The suite starts the site itself and shuts it down afterwards, so it needs
 * nothing running first:
 *
 *     deno task smoke
 *
 * It is slow — a boot builds guide worktrees and compiles css, and the first
 * document that mentions a package clones the repository it came from — and it
 * needs the network, so it is deliberately not named `*.test.ts` and stays out
 * of `deno task test`.
 */

function options() {
  let parsed = parse(www, {
    // the declared defaults, plus GITHUB_TOKEN and JSR_API when the
    // environment has them, so the crawl is not rate limited
    argv: [],
    envs: [{ name: "environment", value: Deno.env.toObject() }],
  });

  if (!parsed.ok || parsed.method !== "execute") {
    throw new Error("could not read the site's default options");
  }

  return {
    ...parsed.model,
    // let the os pick, so a dev server on 8000 is left alone
    port: 0,
    // and keep off the directories that server rebuilds from scratch on boot
    clonesDir: "build/smoke/clones",
    worktreesDir: "build/smoke/worktrees",
    tailwindOutdir: "build/smoke/tailwind",
  };
}

function markdown(response: FetchResponse) {
  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("Content-Type"),
    "text/markdown; charset=utf-8",
  );
}

describe("the markdown an agent reads", () => {
  /**
   * Where this suite's own site is listening. `beforeAll` holds the resource
   * on the suite's scope, so the server is up for every case below and goes
   * away with the suite.
   */
  let site: URL;

  beforeAll(function* () {
    let server = yield* useSite(options());

    site = new URL(
      "/",
      `http://${
        server.hostname === "0.0.0.0" ? "localhost" : server.hostname
      }:${server.port}`,
    );
  });

  // `site` is where the documents are fetched from; the urls inside them
  // belong to whatever the site is configured to advertise, which is not
  // necessarily the address these cases are talking to
  function* get(path: string) {
    let response = yield* fetch(new URL(path, site));

    return [response, yield* response.text()] as const;
  }

  it("/AGENTS.md serves the behavioral contract", function* () {
    let [response, body] = yield* get("/AGENTS.md");

    markdown(response);
    assertStringIncludes(body, "## Core invariants (do not violate)");
    assertStringIncludes(body, "## `ensure()`");
    // the repository's own rules stay in the repository
    assertEquals(body.includes("## Pre-commit workflow"), false);
    // and its links lead to the site rather than to github
    assertMatch(body, /consult the API reference:\nhttps?:\/\/\S+\/api\//);
    assertEquals(body.includes("raw.githubusercontent.com"), false);
  });

  it("/llms.txt leads to markdown, not to github", function* () {
    let [response, body] = yield* get("/llms.txt");

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

  it("/guides/:series/:id.md serves a guide's source", function* () {
    let [response, body] = yield* get("/guides/v4/operations.md");

    markdown(response);
    assertStringIncludes(body, "## Stateless");
  });

  it("/x/:package.md serves a readme that says how to install it", function* () {
    let [response, body] = yield* get("/x/task-buffer.md");

    markdown(response);
    assertStringIncludes(body, "# Task Buffer");
    // exactly once: the readmes that already say it are left alone
    assertEquals(
      body.split("npm install @effectionx/task-buffer").length - 1,
      1,
    );
  });

  it("/api.md indexes the symbols, /api/:series/:symbol.md documents one", function* () {
    let [index, list] = yield* get("/api.md");

    markdown(index);
    assertStringIncludes(list, "# API Reference");
    assertMatch(list, /^- \[main\]\(https?:\/\/\S+\/api\/v4\/main\.md\)$/m);

    let [symbol, page] = yield* get("/api/v4/main.md");

    markdown(symbol);
    assertStringIncludes(page, "# main");
    assertMatch(page, /```ts\n.*function main/);
  });

  it("an unknown symbol is not found rather than a crash", function* () {
    let [response] = yield* get("/api/v4/does-not-exist.md");

    assertEquals(response.status, 404);
  });

  it("the pages these documents come from still render", function* () {
    for (
      let path of [
        "/api",
        "/api/v4/main",
        "/guides/v4/operations",
        "/x/task-buffer",
      ]
    ) {
      let [response] = yield* get(path);

      assertEquals(
        response.status,
        200,
        `${path} responded ${response.status}`,
      );
      assertStringIncludes(
        response.headers.get("Content-Type") ?? "",
        "text/html",
      );
    }
  });
});
