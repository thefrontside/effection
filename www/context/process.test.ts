import {
  each,
  Operation,
  spawn,
  Stream,
  until,
  withResolvers,
} from "effection";
import { describe, it } from "../testing.ts";
import { urlFromCommand, useProcess, ProcessOutputCache } from "./process.ts";
import { expect } from "expect";

describe("urlFromCommand", () => {
  it("returns an URL with md5", function* () {
    expect(urlFromCommand("hello world")).toMatchObject({
      protocol: "https:",
      hostname: "cache.local",
      pathname: "/5eb63bbbe01eeed093cb22bb8f5acdc3",
    });
  });
});

describe("ProcessOutputCache", () => {
  it("caches matching", function* () {
    const cache = yield* until(caches.open("command-cache"));

    const url = urlFromCommand("hello world");

    yield* until(cache.put(url, new Response("hello world")));

    yield* ProcessOutputCache([/hello/]);

    const process = yield* useProcess("hello world");

    yield* process;

    expect(yield* drain(process.stdout)).toBe("hello world");
  });
  it("caches the result after first execution", function* () {
    const cache = yield* until(caches.open("command-cache"));

    const url = urlFromCommand("echo hello world");

    yield* ProcessOutputCache([/echo/]);

    expect(yield* until(cache.match(url))).toBeUndefined();

    const process = yield* useProcess("echo hello world");

    expect(yield* drain(process.stdout)).toBe("hello world");

    expect(yield* until(cache.match(url))).resolves.toBeInstanceOf(Response);
  });
});

function* drain(source: Stream<string, void>): Operation<string> {
  const complete = withResolvers<string>();
  yield* spawn(function* () {
    let chunks = "";
    for (const chunk of yield* each(source)) {
      chunks += chunk;
      yield* each.next();
    }
    complete.resolve(chunks);
  });

  return yield* complete.operation;
}
