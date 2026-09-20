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

/**
 * Like {@link useAbsoluteUrlFactory}, except that it honors the `SITE_URL`
 * of the published site when one is configured.
 *
 * Absolute urls in HTML are rewritten to the destination site by staticalize
 * when the site is built, so they can just use the origin of the request.
 * Urls inside non HTML resources such as `llms.txt` are copied verbatim, so
 * they need to be published under `SITE_URL` instead of the loopback address
 * that the build serves from. With no `SITE_URL`, they point at the dev
 * server, same as every other absolute url.
 */
export function* useSiteUrl(): Operation<(path: string) => string> {
  let siteUrl = Deno.env.get("SITE_URL");

  if (!siteUrl) {
    return yield* useAbsoluteUrlFactory();
  }

  let base = new URL(siteUrl);

  return (path) => {
    let url = new URL(base);
    url.pathname = posixNormalize(`${base.pathname}/${path}`);
    return url.toString();
  };
}
