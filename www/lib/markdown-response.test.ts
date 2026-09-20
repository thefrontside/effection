import { assertEquals } from "@std/assert";

import { markdown, notFound } from "./markdown-response.ts";

Deno.test("markdown() serves text a browser will not hold on to", async () => {
  let response = markdown("# hello\n");

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("Content-Type"),
    "text/markdown; charset=utf-8",
  );
  assertEquals(response.headers.get("Cache-Control"), "no-cache");
  assertEquals(await response.text(), "# hello\n");
});

Deno.test("notFound() says what was not found", async () => {
  let response = notFound("there is no package called 'nope'");

  assertEquals(response.status, 404);
  assertEquals(
    response.headers.get("Content-Type"),
    "text/plain; charset=utf-8",
  );
  assertEquals(await response.text(), "there is no package called 'nope'\n");
});
