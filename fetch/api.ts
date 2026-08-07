import { type Api, createApi } from "@effectionx/context-api";
import { type Operation, ensure, until } from "effection";

import { createFetchResponse } from "./create-fetch-response.ts";
import { type FetchInit, type FetchResponse, HttpError } from "./fetch.ts";

export interface Fetch {
  fetch(
    input: RequestInfo | URL,
    init: FetchInit | undefined,
    shouldExpect: boolean,
  ): Operation<FetchResponse>;
}

export const FetchApi: Api<Fetch> = createApi("fetch", {
  *fetch(
    input: RequestInfo | URL,
    init: FetchInit | undefined,
    shouldExpect: boolean,
  ): Operation<FetchResponse> {
    // Do not replace this with useAbortSignal(); its unconditional scope-exit
    // abort can make Node's fetch throw after the request has settled.
    let controller = new AbortController();
    let settled = false;

    yield* ensure(() => {
      if (!settled) {
        controller.abort();
      }
    });

    let response = yield* until(
      globalThis
        .fetch(input, { ...init, signal: controller.signal })
        .finally(() => {
          settled = true;
        }),
    );
    let fetchResponse = createFetchResponse(response);

    if (shouldExpect && !response.ok) {
      throw new HttpError(
        response.status,
        response.statusText,
        response.url,
        fetchResponse,
      );
    }

    return fetchResponse;
  },
});

export const coreFetch = FetchApi.operations.fetch;
