import { describe, it } from "../testing.ts";
import { expect } from "expect";

import { CurrentRequest } from "../context/request.ts";
import { useSiteUrl } from "../plugins/current-request.ts";
import {
  apiIndexMarkdown,
  apiSymbolMarkdown,
  apiSymbolPath,
  type ApiVersion,
} from "./api-markdown.ts";

const VERSIONS: ApiVersion[] = [
  {
    series: "v4",
    version: "4.1.1",
    symbols: [
      { name: "main" },
      { name: "run" },
      { name: "peek", experimental: true },
    ],
  },
  { series: "v3", version: "3.6.1", symbols: [{ name: "main" }] },
];

describe("apiSymbolPath", () => {
  it("puts experimental symbols under their own segment, like their pages", function* () {
    expect(apiSymbolPath("v4", { name: "main" })).toEqual("/api/v4/main.md");
    expect(apiSymbolPath("v4", { name: "peek", experimental: true })).toEqual(
      "/api/v4/experimental/peek.md",
    );
  });
});

describe("apiIndexMarkdown", () => {
  it("links every symbol to the markdown page of its own version", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/api.md"));
    Deno.env.delete("SITE_URL");

    let index = apiIndexMarkdown(VERSIONS, yield* useSiteUrl());

    expect(index).toContain("# API Reference");
    expect(index).toContain("## 4.1.1");
    expect(index).toContain("## 3.6.1");
    expect(index).toContain("- [main](http://localhost:8000/api/v4/main.md)");
    expect(index).toContain("- [main](http://localhost:8000/api/v3/main.md)");
    expect(index).toContain(
      "- [peek](http://localhost:8000/api/v4/experimental/peek.md) (experimental)",
    );
  });

  it("links to the markdown page of every symbol it lists", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/api.md"));
    Deno.env.delete("SITE_URL");

    let url = yield* useSiteUrl();
    let index = apiIndexMarkdown(VERSIONS, url);

    for (let { series, symbols } of VERSIONS) {
      for (let symbol of symbols) {
        // the same path the symbol routes serve, built by the same function
        expect(index).toContain(`(${url(apiSymbolPath(series, symbol))})`);
      }
    }
  });

  it("keeps its links on the site that is serving it", function* () {
    yield* CurrentRequest.set(new Request("http://127.0.0.1:8000/api.md"));
    Deno.env.set("SITE_URL", "https://pr-42--effection.netlify.app");

    try {
      let index = apiIndexMarkdown(VERSIONS, yield* useSiteUrl());

      expect(index).toContain(
        "- [main](https://pr-42--effection.netlify.app/api/v4/main.md)",
      );
      expect(index).not.toContain("127.0.0.1");
      expect(index).not.toContain("frontside.com");
    } finally {
      Deno.env.delete("SITE_URL");
    }
  });

  it("keeps the production base path", function* () {
    yield* CurrentRequest.set(new Request("http://127.0.0.1:8000/api.md"));
    Deno.env.set("SITE_URL", "https://frontside.com/effection");

    try {
      let index = apiIndexMarkdown(VERSIONS, yield* useSiteUrl());

      expect(index).toContain(
        "- [main](https://frontside.com/effection/api/v4/main.md)",
      );
    } finally {
      Deno.env.delete("SITE_URL");
    }
  });
});

describe("apiSymbolMarkdown", () => {
  it("writes the declaration, the documentation and where the code lives", function* () {
    let page = apiSymbolMarkdown("main", [
      {
        signature:
          "async function main(body: (args: string[]) => Operation<void>): Promise<void>",
        markdown: "Top-level entry point to programs written in Effection.\n",
        source:
          "https://github.com/thefrontside/effection/tree/effection-v4.1.1/lib/main.ts#L63",
      },
    ]);

    expect(page).toEqual(
      `# main

\`\`\`ts
async function main(body: (args: string[]) => Operation<void>): Promise<void>
\`\`\`

Top-level entry point to programs written in Effection.

[View code](https://github.com/thefrontside/effection/tree/effection-v4.1.1/lib/main.ts#L63)
`,
    );
  });

  it("writes one block per declaration", function* () {
    let page = apiSymbolMarkdown("call", [
      {
        signature: "function call(fn: () => void): Operation<void>",
        markdown: "one",
      },
      {
        signature: "function call(promise: Promise<void>): Operation<void>",
        markdown: "two",
      },
    ]);

    expect(page.match(/```ts/g)).toHaveLength(2);
    expect(page).toContain("one");
    expect(page).toContain("two");
  });
});
