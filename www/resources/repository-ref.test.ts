import { assertEquals } from "jsr:@std/assert@1.0.10";
import { matchRef } from "./repository-ref.ts";

Deno.test("normalizes ref ", () => {
  assertEquals(matchRef("/refs/heads/main"), {
    type: "branch",
    name: "main",
    ref: "heads/main",
  });
  assertEquals(matchRef("refs/heads/main"), {
    type: "branch",
    name: "main",
    ref: "heads/main",
  });
  assertEquals(matchRef("/refs/tags/v0.0.1"), {
    type: "tag",
    name: "v0.0.1",
    ref: "tags/v0.0.1",
  });
  assertEquals(matchRef("refs/tags/v0.0.1"), {
    type: "tag",
    name: "v0.0.1",
    ref: "tags/v0.0.1",
  });
});
