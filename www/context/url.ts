import { type Operation } from "effection";
import { posixNormalize } from "_posixNormalize";
import { createApi } from "@effectionx/context-api";
import { CurrentRequest } from "./request.ts";

export interface UrlApi {
  /**
   * Fully qualify a path against the origin that served the current request,
   * so that a document advertises the site a reader is actually on.
   *
   * Middleware installed with `urlApi.around` sees each path, so an override
   * can rebase some paths and leave others alone.
   */
  url(path: string): Operation<string>;
}

export const urlApi = createApi<UrlApi>("url", {
  *url(path) {
    let request = yield* CurrentRequest.expect();
    let absolute = new URL(path, new URL(request.url).origin);

    absolute.pathname = posixNormalize(absolute.pathname);

    return absolute.toString();
  },
});

export const { url } = urlApi.operations;

/**
 * The url of the page being served.
 *
 * What makes it canonical is the crawl: staticalize rewrites it onto
 * `--canonical`, so the Netlify copy and a preview both name the site the
 * content is published at while staying readable where they are served.
 */
export function* currentUrl(): Operation<string> {
  let request = yield* CurrentRequest.expect();

  return yield* url(new URL(request.url).pathname);
}
