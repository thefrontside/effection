import { describe, it } from "../testing.ts";
import { expect } from "expect";

import { CurrentRequest } from "../context/request.ts";
import { useSiteUrl } from "../plugins/current-request.ts";
import { LLMS_TXT_HEADER, llmsTxtFooter } from "./llms-txt-route.ts";

describe("llmsTxtFooter", () => {
  it("points AGENTS.md at the dev server it is served from", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/llms.txt"));
    Deno.env.delete("SITE_URL");

    let footer = llmsTxtFooter(yield* useSiteUrl(), "v4");

    expect(footer).toContain("[AGENTS.md]: http://localhost:8000/AGENTS.md");
    expect(footer).toContain("[API]: http://localhost:8000/api.md");
    expect(footer).toContain(
      "[Operations]: http://localhost:8000/guides/v4/operations.md",
    );
  });

  it("points AGENTS.md at the site's base path in production", function* () {
    yield* CurrentRequest.set(new Request("http://127.0.0.1:8000/llms.txt"));
    Deno.env.set("SITE_URL", "https://frontside.com/effection");

    try {
      let footer = llmsTxtFooter(yield* useSiteUrl(), "v4");

      expect(footer).toContain(
        "[AGENTS.md]: https://frontside.com/effection/AGENTS.md",
      );
      expect(footer).toContain(
        "[Operations]: https://frontside.com/effection/guides/v4/operations.md",
      );
    } finally {
      Deno.env.delete("SITE_URL");
    }
  });

  it("no longer sends agents to raw.githubusercontent.com at all", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/llms.txt"));
    Deno.env.delete("SITE_URL");

    let footer = llmsTxtFooter(yield* useSiteUrl(), "v4");

    expect(footer).not.toContain("raw.githubusercontent.com");
    expect(footer).not.toContain("github.com");

    let definitions = footer.split("\n").filter((line) =>
      /^\[[^\]]+\]: /.test(line)
    );

    expect(definitions.length).toBeGreaterThan(0);
    for (let definition of definitions) {
      expect(definition).toContain("http://localhost:8000/");
    }
  });

  it("defines every reference it uses", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/llms.txt"));
    Deno.env.delete("SITE_URL");

    let document = `${LLMS_TXT_HEADER}\n${
      llmsTxtFooter(yield* useSiteUrl(), "v4")
    }`;

    let defined = new Set(
      [...document.matchAll(/^\[([^\]]+)\]: /gm)].map(([, label]) => label),
    );
    // the label of `[label]` and of `[text][label]`, but not `[text](url)`,
    // not the text of `[text][label]`, and not a definition
    let used = [...document.matchAll(/\[([^\]]+)\](?![([:])/g)]
      .map(([, label]) => label);

    expect(used.length).toBeGreaterThan(0);
    for (let label of used) {
      expect({ label, defined: defined.has(label) }).toEqual({
        label,
        defined: true,
      });
    }
  });

  it("leaves the catalog of api symbols to the api index", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/llms.txt"));
    Deno.env.delete("SITE_URL");

    let document = `${LLMS_TXT_HEADER}\n${
      llmsTxtFooter(yield* useSiteUrl(), "v4")
    }`;

    expect(document).toContain("/api.md");
    // the index owns the list; llms.txt links to it rather than repeating it
    expect(document).not.toContain("/api/v4/");
  });
});
