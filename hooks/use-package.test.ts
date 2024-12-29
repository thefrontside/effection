import { assertEquals } from "jsr:@std/assert";
import { ensureTrailingSlash } from "./use-package.tsx";

Deno.test("ensureTrailingSlash adds trailing slash to each URL", () => {
  assertEquals(
    ensureTrailingSlash(new URL("http://example.com/dir")).toString(),
    "http://example.com/dir/",
  );
  assertEquals(
    ensureTrailingSlash(new URL("http://example.com/dir/")).toString(),
    "http://example.com/dir/",
  );
  assertEquals(
    ensureTrailingSlash(new URL("http://example.com/file.json")).toString(),
    "http://example.com/file.json",
  );
});
