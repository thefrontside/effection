import { Operation, Scope, Stream, each, resource, useScope } from "effection";
import { expect } from "https://deno.land/x/expect/mod.ts";
import { writeSync } from "https://deno.land/x/fixturify@3.0.0/mod.ts";
import { beforeEach, describe, it } from "../test/deno.bdd.ts";
import { CwdContext, useCwd } from "./use-cwd.ts";
import { useMkdir } from "./use-mkdir.ts";
import { useReadDir } from "./use-read-dir.ts";

function* withTmpCwd<T>(op: () => Operation<T>): Operation<T> {
  let current = yield* CwdContext.get();
  const tmp = Deno.makeTempFileSync();
  yield* CwdContext.set(tmp);
  try {
    return yield* op();
  } finally {
    yield* CwdContext.set(current);
  }
}

function* capture<T, TReturn>(stream: Stream<T, TReturn>): Operation<T[]> {
  const result: T[] = [];
  for (let value of yield* each(stream)) {
    result.push(value);
    yield* each.next();
  }
  return result;
}

describe("use-read-dir", () => {
  beforeEach(function* () {
    yield* withTmpCwd(function*() {
      yield* useMkdir("testdir");

      writeSync("testdir", {
	"index.html": "<html><body><h1>Effection Docs</h1></body></html>",
	"fuse.js": `console.log("hello world")`,
	"page.css": "body { background: black; }",
	"~": {
	  "main.html": "<html><body><h1>main()</h1></body></html>",
	},
      });
    });

  });

  it("reads files from tmp testdir", function* () {
    expect(yield* capture(yield* useReadDir("testdir"))).toEqual([
      {
	name: "index.html",
	isFile: true,
      },
      {
	name: "page.css",
	isFile: true,
      },
      {
	name: 'fuse.js',
	isFile: true,
      },
      {
	name: '~',
	isDirectory: true
      }
    ]);
  });
});
