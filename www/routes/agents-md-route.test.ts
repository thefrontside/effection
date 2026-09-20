import { describe, it } from "../testing.ts";
import { expect } from "expect";
import type { Operation } from "effection";
import { until } from "effection";
import { fromFileUrl } from "@std/path";
import { toHtml } from "hast-util-to-html";

import { CurrentRequest } from "../context/request.ts";
import { Footer } from "../components/footer.tsx";
import { agentsMdRoute } from "./agents-md-route.ts";

const PUBLIC_CONTRACT = fromFileUrl(
  import.meta.resolve("../../docs/agents.md"),
);
const REPOSITORY_CONTRACT = fromFileUrl(import.meta.resolve("../../AGENTS.md"));
const WWW_INSTRUCTIONS = fromFileUrl(import.meta.resolve("../AGENTS.md"));

function* get(url: string): Operation<Response> {
  let { handler } = agentsMdRoute();

  return yield* handler(new Request(url), function* (): Operation<Response> {
    throw new Error("the route handles the request itself");
  });
}

describe("agentsMdRoute", () => {
  it("serves the behavioral contract as markdown", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/AGENTS.md"));
    Deno.env.delete("SITE_URL");

    let response = yield* get("http://localhost:8000/AGENTS.md");

    expect(response.status).toEqual(200);
    expect(response.headers.get("Content-Type")).toEqual(
      "text/markdown; charset=utf-8",
    );
    // the contract is rewritten per environment, so a browser must not hold
    // one environment's copy and show it in another
    expect(response.headers.get("Cache-Control")).toEqual("no-cache");

    let body = yield* until(response.text());

    expect(body).toContain("### Operations vs Promises");
    expect(body).toContain("## `ensure()`");
    expect(body).toContain("## `useAbortSignal()`");
  });

  it("leaves the repository's own rules out of it", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/AGENTS.md"));
    Deno.env.delete("SITE_URL");

    let body = yield* until(
      (yield* get("http://localhost:8000/AGENTS.md")).text(),
    );

    expect(body).not.toContain("## Commit and PR conventions");
    expect(body).not.toContain("## Pre-commit workflow");
    expect(body).not.toContain("gitmoji");
  });

  it("points its own documentation links at the dev server", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/AGENTS.md"));
    Deno.env.delete("SITE_URL");

    let body = yield* until(
      (yield* get("http://localhost:8000/AGENTS.md")).text(),
    );

    expect(body).toContain("http://localhost:8000/api/");
    expect(body).not.toContain("https://frontside.com/effection/api/");
    expect(body).not.toContain("raw.githubusercontent.com");
  });

  it("points them at the base path of the published site", function* () {
    yield* CurrentRequest.set(new Request("http://127.0.0.1:8000/AGENTS.md"));
    Deno.env.set("SITE_URL", "https://frontside.com/effection");

    try {
      let body = yield* until(
        (yield* get("http://127.0.0.1:8000/AGENTS.md")).text(),
      );

      expect(body).toContain("https://frontside.com/effection/api/");
      expect(body).not.toContain("127.0.0.1");
    } finally {
      Deno.env.delete("SITE_URL");
    }
  });

  it("leaves urls that are not part of this site alone", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/AGENTS.md"));
    Deno.env.delete("SITE_URL");

    let body = yield* until(
      (yield* get("http://localhost:8000/AGENTS.md")).text(),
    );

    expect(body).toContain(
      "https://frontside.com/blog/2025-08-04-the-heartbreaking-inadequacy-of-abort-controller/",
    );
  });

  it("is in the sitemap, so that it is captured by a static build", function* () {
    let { routemap } = agentsMdRoute();

    let paths = yield* routemap!(
      () => "/AGENTS.md",
      new Request("http://localhost:8000/sitemap.xml"),
    );

    expect(paths).toEqual([{ pathname: "/AGENTS.md" }]);
  });
});

describe("agent instructions", () => {
  it("keeps the repository's rules in the root AGENTS.md, pointing at the contract", function* () {
    let root = yield* until(Deno.readTextFile(REPOSITORY_CONTRACT));

    expect(root).toContain("docs/agents.md");
    expect(root).toContain("## Commit and PR conventions");
    expect(root).toContain("## Pre-commit workflow");
    expect(root).toContain("## Pull requests");
    expect(root).not.toContain("### Operations vs Promises");
  });

  it("keeps www/AGENTS.md scoped to writing for the website", function* () {
    let scoped = yield* until(Deno.readTextFile(WWW_INSTRUCTIONS));

    expect(scoped).toContain("# Effection Blog — Writing Agent Guide");
    expect(scoped).toContain("docs/agents.md");
    expect(scoped).not.toContain("## Core invariants (do not violate)");
  });

  it("keeps the contract itself out of the repository's root", function* () {
    let contract = yield* until(Deno.readTextFile(PUBLIC_CONTRACT));

    expect(contract).toContain("## Core invariants (do not violate)");
    expect(contract).not.toContain("## Pre-commit workflow");
  });

  it("links to the hosted route from the footer", function* () {
    let html = toHtml(Footer() as Parameters<typeof toHtml>[0]);

    expect(html).toContain('href="/AGENTS.md"');
    expect(html).not.toContain("raw.githubusercontent.com");
  });
});
