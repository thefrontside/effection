import { assertEquals, assertStringIncludes } from "@std/assert";
import type { ClassMethodDef, FunctionDef } from "@deno/doc";
import { run } from "effection";
import { methodList } from "../components/type/markdown.tsx";
import { docLoader, resolveDocSpecifier } from "./use-deno-doc.tsx";

Deno.test("resolves package, subpath, builtin, and relative imports", () => {
  let imports = {
    "@effectionx/middleware": "npm:@effectionx/middleware@0.2.0",
    effection: "npm:effection@3.6.1",
  };
  let referrer = "file:///workspace/mod.ts";

  assertEquals(
    resolveDocSpecifier("effection", referrer, imports),
    "npm:effection@3.6.1",
  );
  assertEquals(
    resolveDocSpecifier(
      "@effectionx/middleware/testing",
      referrer,
      imports,
    ),
    "npm:@effectionx/middleware@0.2.0/testing",
  );
  assertEquals(
    resolveDocSpecifier("node:test", referrer, imports),
    "npm:@types/node@^22.13.5",
  );
  assertEquals(
    resolveDocSpecifier("./local.ts", referrer, imports),
    "file:///workspace/local.ts",
  );
  assertEquals(
    resolveDocSpecifier("@std/testing/bdd", referrer, imports),
    "external:@std/testing/bdd",
  );
  assertEquals(
    resolveDocSpecifier(
      "https://jsr.io/@std/testing/mod.ts",
      referrer,
      imports,
    ),
    "https://jsr.io/@std/testing/mod.ts",
  );
});

Deno.test("marks unsupported modules as external", async () => {
  for (
    let specifier of [
      "npm:effection@3.6.1",
      "npm:@effectionx/middleware@0.2.0",
      "node:test",
      "external:@std/testing/bdd",
    ]
  ) {
    assertEquals(await run(docLoader(specifier)), {
      kind: "external",
      specifier,
    });
  }
});

Deno.test("renders declared and runtime class method shapes", () => {
  let definition: FunctionDef = {
    params: [],
    typeParams: [],
    returnType: {
      kind: "keyword",
      value: "string",
    },
  };
  let methods = [
    {
      name: "declaredMethod",
      def: definition,
      jsDoc: { doc: "Uses the declared v2 shape." },
    },
    {
      name: "runtimeMethod",
      functionDef: definition,
      jsDoc: { doc: "Uses the shape emitted by the v2 WASM runtime." },
    },
  ] as unknown as ClassMethodDef[];

  let markdown = methodList(methods).join("\n");
  assertStringIncludes(markdown, "**declaredMethod**(): string");
  assertStringIncludes(markdown, "Uses the declared v2 shape.");
  assertStringIncludes(markdown, "**runtimeMethod**(): string");
  assertStringIncludes(
    markdown,
    "Uses the shape emitted by the v2 WASM runtime.",
  );
});
