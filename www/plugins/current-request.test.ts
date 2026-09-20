import { describe, it } from "../testing.ts";
import { expect } from "expect";

import { CurrentRequest } from "../context/request.ts";
import { useSiteUrl } from "./current-request.ts";

describe("useSiteUrl", () => {
  it("uses the origin of the current request by default", function* () {
    yield* CurrentRequest.set(new Request("http://localhost:8000/llms.txt"));
    Deno.env.delete("SITE_URL");

    let url = yield* useSiteUrl();

    expect(url("/x/")).toEqual("http://localhost:8000/x/");
    expect(url("/x/websocket")).toEqual("http://localhost:8000/x/websocket");
  });

  it("uses SITE_URL when it has no path of its own", function* () {
    yield* CurrentRequest.set(new Request("http://127.0.0.1:8000/llms.txt"));
    Deno.env.set("SITE_URL", "https://pr-42--effection.netlify.app");

    try {
      let url = yield* useSiteUrl();

      expect(url("/x/")).toEqual("https://pr-42--effection.netlify.app/x/");
      expect(url("/blog")).toEqual(
        "https://pr-42--effection.netlify.app/blog",
      );
    } finally {
      Deno.env.delete("SITE_URL");
    }
  });

  it("uses SITE_URL when it is set, preserving its path", function* () {
    yield* CurrentRequest.set(new Request("http://127.0.0.1:8000/llms.txt"));
    Deno.env.set("SITE_URL", "https://frontside.com/effection");

    try {
      let url = yield* useSiteUrl();

      expect(url("/x/")).toEqual("https://frontside.com/effection/x/");
      expect(url("/blog")).toEqual("https://frontside.com/effection/blog");
    } finally {
      Deno.env.delete("SITE_URL");
    }
  });
});
