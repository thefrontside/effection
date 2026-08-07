import { beforeEach, describe, it } from "@effectionx/vitest";
import { expect } from "expect";

import {
  type IncomingMessage,
  type ServerResponse,
  createServer,
} from "node:http";
import {
  Err,
  Ok,
  type Operation,
  type Result,
  call,
  each,
  ensure,
  spawn,
  withResolvers,
} from "effection";

import { createFetchResponse } from "./create-fetch-response.ts";
import { FetchApi, HttpError, fetch } from "./mod.ts";

function box<T>(content: () => Operation<T>): Operation<Result<T>> {
  return {
    *[Symbol.iterator]() {
      try {
        return Ok(yield* content());
      } catch (error) {
        return Err(error as Error);
      }
    },
  };
}

describe("fetch()", () => {
  let url: string;

  beforeEach(function* () {
    let server = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (req.url === "/json") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: 1, title: "do things" }));
        return;
      }

      if (req.url === "/text") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("hello");
        return;
      }

      if (req.url === "/stream") {
        res.writeHead(200, { "Content-Type": "application/octet-stream" });
        res.write("chunk-1");
        res.write("chunk-2");
        res.end("chunk-3");
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("not found");
    });

    let ready = withResolvers<void>();
    server.listen(0, () => ready.resolve());
    yield* ready.operation;

    let addr = server.address();
    let port = typeof addr === "object" && addr ? addr.port : 0;

    url = `http://localhost:${port}`;
    yield* ensure(() =>
      call(() => new Promise<void>((resolve) => server.close(() => resolve()))),
    );
  });

  describe("traditional API", () => {
    it("reads JSON responses", function* () {
      let response = yield* fetch(`${url}/json`);
      let data = yield* response.json<{ id: number; title: string }>();

      expect(data).toEqual({ id: 1, title: "do things" });
    });

    it("supports parser-based json()", function* () {
      let response = yield* fetch(`${url}/json`);
      let data = yield* response.json((value) => {
        if (
          typeof value !== "object" ||
          value === null ||
          !("id" in value) ||
          !("title" in value)
        ) {
          throw new Error("invalid payload");
        }

        return { id: value.id as number, title: value.title as string };
      });

      expect(data).toEqual({ id: 1, title: "do things" });
    });

    it("streams response bodies", function* () {
      let response = yield* fetch(`${url}/stream`);
      let body = response.body();
      let decoder = new TextDecoder();
      let chunks: string[] = [];

      for (let chunk of yield* each(body)) {
        chunks.push(decoder.decode(chunk, { stream: true }));
        yield* each.next();
      }

      chunks.push(decoder.decode());
      expect(chunks.join("")).toEqual("chunk-1chunk-2chunk-3");
    });

    it("throws HttpError for expect() when response is not ok", function* () {
      let response = yield* fetch(`${url}/missing`);
      let result = yield* box(() => response.expect());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(HttpError);
        expect(result.error).toMatchObject({
          status: 404,
          statusText: "Not Found",
        });
      }
    });
  });

  describe("fluent API", () => {
    it("reads JSON with fetch().json()", function* () {
      let data = yield* fetch(`${url}/json`).json<{
        id: number;
        title: string;
      }>();

      expect(data).toEqual({ id: 1, title: "do things" });
    });

    it("reads text with fetch().text()", function* () {
      let text = yield* fetch(`${url}/text`).text();

      expect(text).toEqual("hello");
    });

    it("supports parser with fetch().json(parse)", function* () {
      let data = yield* fetch(`${url}/json`).json((value) => {
        if (
          typeof value !== "object" ||
          value === null ||
          !("id" in value) ||
          !("title" in value)
        ) {
          throw new Error("invalid payload");
        }

        return { id: value.id as number, title: value.title as string };
      });

      expect(data).toEqual({ id: 1, title: "do things" });
    });

    it("streams response bodies with fetch().body()", function* () {
      let body = fetch(`${url}/stream`).body();
      let decoder = new TextDecoder();
      let chunks: string[] = [];

      for (let chunk of yield* each(body)) {
        chunks.push(decoder.decode(chunk, { stream: true }));
        yield* each.next();
      }

      chunks.push(decoder.decode());
      expect(chunks.join("")).toEqual("chunk-1chunk-2chunk-3");
    });

    it("throws HttpError with fetch().expect().json()", function* () {
      let result = yield* box(() => fetch(`${url}/missing`).expect().json());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(HttpError);
        expect(result.error).toMatchObject({
          status: 404,
          statusText: "Not Found",
        });
      }
    });

    it("chains expect() before json() successfully", function* () {
      let data = yield* fetch(`${url}/json`)
        .expect()
        .json<{ id: number; title: string }>();

      expect(data).toEqual({ id: 1, title: "do things" });
    });
  });

  describe("cancellation", () => {
    it("does not abort a settled native fetch when its scope closes", function* () {
      let nativeFetch = globalThis.fetch;
      let requestSignal: AbortSignal | null | undefined;

      globalThis.fetch = (input, init) => {
        requestSignal = init?.signal;
        return nativeFetch(input, init);
      };

      try {
        let task = yield* spawn(function* () {
          yield* fetch("data:text/plain,hello");
        });

        yield* task;

        expect(requestSignal).toBeDefined();
        expect(requestSignal?.aborted).toBe(false);
      } finally {
        globalThis.fetch = nativeFetch;
      }
    });

    it("aborts an in-flight native fetch when its scope closes", function* () {
      let nativeFetch = globalThis.fetch;
      let started = withResolvers<AbortSignal>();

      globalThis.fetch = (_input, init) =>
        new Promise((_resolve, reject) => {
          let signal = init?.signal;

          if (!signal) {
            reject(new Error("expected fetch to receive an abort signal"));
            return;
          }

          started.resolve(signal);
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
        });

      try {
        let task = yield* spawn(function* () {
          yield* fetch("https://example.test/pending");
        });
        let requestSignal = yield* started.operation;

        yield* task.halt();

        expect(requestSignal.aborted).toBe(true);
      } finally {
        globalThis.fetch = nativeFetch;
      }
    });
  });

  describe("middleware API", () => {
    it("can intercept requests with logging", function* () {
      let requestedUrls: string[] = [];

      yield* FetchApi.around({
        *fetch(args, next) {
          let [input] = args;
          requestedUrls.push(String(input));
          return yield* next(...args);
        },
      });

      yield* fetch(`${url}/json`).json();
      yield* fetch(`${url}/text`).text();

      expect(requestedUrls).toEqual([`${url}/json`, `${url}/text`]);
    });

    it("can mock responses", function* () {
      const mockResponse = createFetchResponse(
        new Response(JSON.stringify({ mocked: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      yield* FetchApi.around({
        *fetch(args, next) {
          let [input] = args;
          if (String(input).includes("/mocked")) {
            return mockResponse;
          }
          return yield* next(...args);
        },
      });

      let mockedData = yield* fetch(`${url}/mocked`).json<{
        mocked: boolean;
      }>();
      expect(mockedData).toEqual({ mocked: true });

      let realData = yield* fetch(`${url}/json`).json<{
        id: number;
        title: string;
      }>();
      expect(realData).toEqual({ id: 1, title: "do things" });
    });

    it("middleware is scoped and does not leak", function* () {
      let outerCalls: string[] = [];
      let innerCalls: string[] = [];

      yield* FetchApi.around({
        *fetch(args, next) {
          outerCalls.push("outer");
          return yield* next(...args);
        },
      });

      yield* fetch(`${url}/json`).json();

      let task = yield* spawn(function* () {
        yield* FetchApi.around({
          *fetch(args, next) {
            innerCalls.push("inner");
            return yield* next(...args);
          },
        });

        yield* fetch(`${url}/json`).json();
      });

      yield* task;

      expect(outerCalls).toEqual(["outer", "outer"]);
      expect(innerCalls).toEqual(["inner"]);
    });
  });
});
