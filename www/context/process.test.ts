import { until } from "effection";
import { describe, it } from "../testing.ts";
import {
  ProcessOutputCache,
  urlFromCommand,
  useProcess,
} from "./process.ts";
import { expect } from "expect";
import { capture } from "../testing/helpers.ts";

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

    const process = yield* capture(useProcess("hello world"));

    expect(process.stdout).toBe("hello world");
  });
  it("caches the result after first execution", function* () {
    const cache = yield* until(caches.open("command-cache"));

    const url = urlFromCommand("echo hello world");

    yield* ProcessOutputCache([/echo/]);

    expect(yield* until(cache.match(url))).toBeUndefined();

    const process = yield* capture(useProcess("echo hello world"));

    expect(process.stdout).toBe("hello world");

    expect(yield* until(cache.match(url))).resolves.toBeInstanceOf(Response);
  });
});
