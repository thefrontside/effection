import type { Operation, Stream } from "effection";

import { coreFetch } from "./api.ts";

/**
 * Request options for fetch, excluding `signal` since cancellation
 * is handled automatically via Effection's structured concurrency.
 */
export type FetchInit = Omit<RequestInit, "signal"> & { signal?: never };

/**
 * Chainable fetch operation that supports fluent API.
 *
 * Can be yielded directly to get a {@link FetchResponse}, or chained
 * with methods like `.json()`, `.text()`, `.body()` for direct consumption.
 *
 * @example
 * ```ts
 * // Fluent API - single yield*
 * let data = yield* fetch("/api/users").json();
 *
 * // With validation - throws HttpError on non-2xx
 * let data = yield* fetch("/api/users").expect().json();
 *
 * // Traditional API - get response first
 * let response = yield* fetch("/api/users");
 * let data = yield* response.json();
 * ```
 */
export interface FetchOperation extends Operation<FetchResponse> {
  /** Parse response body as JSON. */
  json<T = unknown>(): Operation<T>;
  /** Parse response body as JSON with a custom parser. */
  json<T>(parse: (value: unknown) => T): Operation<T>;
  /** Get response body as text. */
  text(): Operation<string>;
  /** Get response body as ArrayBuffer. */
  arrayBuffer(): Operation<ArrayBuffer>;
  /** Get response body as Blob. */
  blob(): Operation<Blob>;
  /** Get response body as FormData. */
  formData(): Operation<FormData>;
  /** Stream response body as chunks. */
  body(): Stream<Uint8Array, void>;
  /** Return a new FetchOperation that throws {@link HttpError} on non-2xx responses. */
  expect(): FetchOperation;
}

/**
 * Effection wrapper around the native {@link Response} object.
 *
 * Provides operation-based methods for consuming the response body,
 * and exposes common response properties.
 */
export interface FetchResponse {
  /** The underlying native Response object. */
  readonly raw: Response;
  /** Whether the response body has been consumed. */
  readonly bodyUsed: boolean;
  /** Whether the response status is in the 200-299 range. */
  readonly ok: boolean;
  /** The HTTP status code. */
  readonly status: number;
  /** The HTTP status message. */
  readonly statusText: string;
  /** The response headers. */
  readonly headers: Headers;
  /** The final URL after redirects. */
  readonly url: string;
  /** Whether the response was redirected. */
  readonly redirected: boolean;
  /** The response type (e.g., "basic", "cors"). */
  readonly type: ResponseType;
  /** Parse response body as JSON. */
  json<T = unknown>(): Operation<T>;
  /** Parse response body as JSON with a custom parser. */
  json<T>(parse: (value: unknown) => T): Operation<T>;
  /** Get response body as text. */
  text(): Operation<string>;
  /** Get response body as ArrayBuffer. */
  arrayBuffer(): Operation<ArrayBuffer>;
  /** Get response body as Blob. */
  blob(): Operation<Blob>;
  /** Get response body as FormData. */
  formData(): Operation<FormData>;
  /** Stream response body as chunks. */
  body(): Stream<Uint8Array, void>;
  /** Throw {@link HttpError} if response is not ok (non-2xx status). */
  expect(): Operation<this>;
}

/**
 * Error thrown when an HTTP response has a non-2xx status code.
 *
 * Thrown by {@link FetchOperation.expect} and {@link FetchResponse.expect}
 * when the response is not ok.
 */
export class HttpError extends Error {
  readonly name = "HttpError";
  /** The HTTP status code. */
  readonly status: number;
  /** The HTTP status message. */
  readonly statusText: string;
  /** The request URL. */
  readonly url: string;
  /** The response that triggered this error. */
  readonly response: FetchResponse;

  constructor(
    status: number,
    statusText: string,
    url: string,
    response: FetchResponse,
  ) {
    super(`HTTP ${status}: ${statusText}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.response = response;
  }
}

/**
 * Perform an HTTP request using the Fetch API with Effection structured concurrency.
 *
 * Cancellation is automatically handled via the current Effection scope.
 * When the scope exits, an in-flight request is aborted.
 *
 * @param input - The URL or Request object
 * @param init - Optional request configuration (same as RequestInit, but without signal)
 * @returns A chainable {@link FetchOperation}
 *
 * @example
 * ```ts
 * // Simple GET request
 * let data = yield* fetch("https://api.example.com/users").json();
 *
 * // POST request with body
 * let result = yield* fetch("https://api.example.com/users", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({ name: "Alice" }),
 * }).expect().json();
 *
 * // Stream response body
 * for (let chunk of yield* each(fetch("/large-file").body())) {
 *   console.log(chunk.length);
 *   yield* each.next();
 * }
 * ```
 */
export function fetch(
  input: RequestInfo | URL,
  init?: FetchInit,
): FetchOperation {
  return createFetchOperation(input, init, false);
}

function createFetchOperation(
  input: RequestInfo | URL,
  init: FetchInit | undefined,
  shouldExpect: boolean,
): FetchOperation {
  function* doFetch(): Operation<FetchResponse> {
    return yield* coreFetch(input, init, shouldExpect);
  }

  return {
    *[Symbol.iterator]() {
      return yield* doFetch();
    },

    *json<T = unknown>(parse?: (value: unknown) => T): Operation<T> {
      let response = yield* doFetch();
      return yield* response.json(parse as (value: unknown) => T);
    },

    *text(): Operation<string> {
      let response = yield* doFetch();
      return yield* response.text();
    },

    *arrayBuffer(): Operation<ArrayBuffer> {
      let response = yield* doFetch();
      return yield* response.arrayBuffer();
    },

    *blob(): Operation<Blob> {
      let response = yield* doFetch();
      return yield* response.blob();
    },

    *formData(): Operation<FormData> {
      let response = yield* doFetch();
      return yield* response.formData();
    },

    body(): Stream<Uint8Array, void> {
      return {
        *[Symbol.iterator]() {
          let response = yield* doFetch();
          return yield* response.body();
        },
      };
    },

    expect(): FetchOperation {
      return createFetchOperation(input, init, true);
    },
  };
}
