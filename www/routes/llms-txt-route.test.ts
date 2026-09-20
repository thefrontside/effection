import { describe, it } from "../testing.ts";
import { expect } from "expect";

import { CurrentRequest } from "../context/request.ts";
import { useSiteUrl } from "../plugins/current-request.ts";
import { llmsTxtFooter } from "./llms-txt-route.ts";

describe("llmsTxtFooter", () => {
  it("points AGENTS.md at the dev server it is served from", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/llms.txt"));
    Deno.env.delete("SITE_URL");

    let footer = llmsTxtFooter(yield* useSiteUrl());

    expect(footer).toContain(
      "[AGENTS.md]: http://localhost:8000/AGENTS.md",
    );
  });

  it("points AGENTS.md at the site's base path in production", function* () {
    yield* CurrentRequest.set(new Request("http://127.0.0.1:8000/llms.txt"));
    Deno.env.set("SITE_URL", "https://frontside.com/effection");

    try {
      let footer = llmsTxtFooter(yield* useSiteUrl());

      expect(footer).toContain(
        "[AGENTS.md]: https://frontside.com/effection/AGENTS.md",
      );
    } finally {
      Deno.env.delete("SITE_URL");
    }
  });

  it("no longer sends agents to raw.githubusercontent.com for AGENTS.md", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/llms.txt"));
    Deno.env.delete("SITE_URL");

    let footer = llmsTxtFooter(yield* useSiteUrl());

    let agentsLinks = footer.split("\n").filter((line) =>
      line.includes("AGENTS.md")
    );

    expect(agentsLinks).toHaveLength(1);
    expect(agentsLinks[0]).not.toContain("raw.githubusercontent.com");
  });
});
