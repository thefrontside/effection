import type { RevolutionPlugin } from "revolution";
import { posixNormalize } from "_posixNormalize";
import { type Operation } from "effection";
import { CurrentRequest } from "../context/request.ts";

export function currentRequestPlugin(): RevolutionPlugin {
  return {
    *http(request, next) {
      yield* CurrentRequest.set(request);
      return yield* next(request);
    },
  };
}

/**
 * Convert a non fully qualified url into a fully qualified url, complete
 * with protocol.
 */
export function* useAbsoluteUrl(path: string = "/"): Operation<string> {
  let absolute = yield* useAbsoluteUrlFactory();

  return absolute(path);
}

export function* useAbsoluteUrlFactory(): Operation<(path: string) => string> {
  let request = yield* CurrentRequest.expect();

  let origin = new URL(request.url).origin;

  return (path) => {
    let url = new URL(path, origin);
    url.pathname = posixNormalize(url.pathname);
    return url.toString();
  };
}

/**
 * Get the canonical url for the current path.
 */
export function* useCanonicalUrl(options: { base: string }): Operation<string> {
  let request = yield* CurrentRequest.expect();

  let req = new URL(request.url);
  let url = new URL(options.base);
  url.pathname = `${url.pathname}${req.pathname}`;
  return String(url);
}
