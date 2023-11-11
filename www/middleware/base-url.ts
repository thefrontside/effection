import { type Middleware } from "revolution";

import { posixNormalize } from "https://deno.land/std@0.203.0/path/_normalize.ts";
import { createContext, type Operation } from "effection";

export const BaseUrl = createContext<URL>("baseUrl");

export const CurrentRequest = createContext<Request>("Request");

export function* useBaseUrl() {
  return yield* BaseUrl;
}

export function* useAbsoluteUrl(path: string): Operation<string> {
  let normalizedPath = posixNormalize(path);
  if (normalizedPath.startsWith("/")) {
    let base = yield* useBaseUrl();
    let url = new URL(base);
    url.pathname = posixNormalize(`${base.pathname}${path}`);
    return url.toString();
  } else {
    let request = yield* CurrentRequest;
    return new URL(path, request.url).toString();
  }
}

export function baseUrlMiddleware(): Middleware<Request, Response> {
  return function* (request, next) {
    yield* CurrentRequest.set(request);

    let rebaseUrl = request.headers.get("X-Base-Url") ?? void 0;
    if (rebaseUrl) {
      yield* BaseUrl.set(new URL(rebaseUrl));
    } else {
      let url = new URL(request.url);
      url.pathname = "/";
      yield* BaseUrl.set(url);
    }

    return yield* next(request);
  };
}
