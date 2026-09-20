import { describe, it } from "../testing.ts";
import { expect } from "expect";
import type { Operation } from "effection";
import { until } from "effection";
import { fromFileUrl } from "@std/path";

import { agentsMdRoute } from "./agents-md-route.ts";

const AGENTS_MD = fromFileUrl(import.meta.resolve("../../AGENTS.md"));

describe("agentsMdRoute", () => {
  it("serves the repository's AGENTS.md as markdown", function* () {
    let { handler } = agentsMdRoute();

    let response = yield* handler(
      new Request("http://localhost:8000/AGENTS.md"),
      function* (): Operation<Response> {
        throw new Error("the route handles the request itself");
      },
    );

    expect(response.status).toEqual(200);
    expect(response.headers.get("Content-Type")).toEqual(
      "text/markdown; charset=utf-8",
    );
    expect(yield* until(response.text())).toEqual(
      yield* until(Deno.readTextFile(AGENTS_MD)),
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
