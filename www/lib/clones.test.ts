import { assertEquals, assertThrows } from "@std/assert";
import { resolve } from "node:path";

import { resolveCheckouts } from "./clones.ts";

Deno.test("resolveCheckouts resolves a checkout to an absolute path", () => {
  let lib = import.meta.dirname!;

  assertEquals(resolveCheckouts({ "acme/widgets": `${lib}/../lib` }), {
    "acme/widgets": lib,
  });
});

Deno.test("resolveCheckouts rejects a directory that is not there", () => {
  let missing = resolve(import.meta.dirname!, "nowhere");

  assertThrows(
    () => resolveCheckouts({ "acme/widgets": missing }),
    Error,
    `cannot use ${missing} as a local checkout of acme/widgets: no such directory`,
  );
});
