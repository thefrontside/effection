import { each, Operation, Stream } from "effection";
import { expect } from "https://deno.land/x/expect/mod.ts";
import { writeSync } from "https://deno.land/x/fixturify@3.0.0/mod.ts";
import { describe, it } from "./deno.bdd.ts";
import { useMkdir } from "./useMkdir.ts";
import { useReadDir } from "./useReadDir.ts";
import { join } from "node:path";
import { useTmpCwd } from "./useTmpCwd.ts";
import { withDeno } from "./withDeno.ts";


function* ___<T>(op: Operation<Stream<T, unknown>>): Operation<T[]> {
  const result: T[] = [];
  for (let value of yield * each(yield* op)) {
    result.push(value);
    yield * each.next();
  }
  return result;
}

describe("useReadDir", () => {
  it("reads files from tmp testdir", function* () {
    yield* withDeno(function* () {
      const twd = yield* useTmpCwd();

      yield* useMkdir("testdir");

      writeSync(join(twd, "testdir"), {
        "index.html": "<html><body><h1>Effection Docs</h1></body></html>",
        "fuse.js": `console.log("hello world")`,
        "page.css": "body { background: black; }",
        "~": {
          "main.html": "<html><body><h1>main()</h1></body></html>",
        },
      });

      const result = yield * ___(useReadDir("testdir"));

      expect(
        result.map((e) => ({
          name: e.name,
          isFile: e.isFile,
          isDirectory: e.isDirectory,
        })),
      ).toEqual([
        {
          name: "index.html",
          isFile: true,
          isDirectory: false,
        },
        {
          name: "page.css",
          isFile: true,
          isDirectory: false,
        },
        {
          name: "fuse.js",
          isFile: true,
          isDirectory: false,
        },
        {
          name: "~",
          isDirectory: true,
          isFile: false,
        },
      ]);
    });
  });
});
