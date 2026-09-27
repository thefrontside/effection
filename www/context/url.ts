import { type Operation } from "effection";
import { posixNormalize } from "_posixNormalize";
import { createApi } from "./context-api.ts";
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

  /**
   * The canonical url for the current path, under `base`.
   *
   * A preview and the dev server serve the same page from their own origin,
   * but every copy names production as the original.
   */
  canonical(options: { base: string }): Operation<string>;
}

export const urlApi = createApi<UrlApi>("url", {
  *url(path) {
    let request = yield* CurrentRequest.expect();
    let absolute = new URL(path, new URL(request.url).origin);

    absolute.pathname = posixNormalize(absolute.pathname);

    return absolute.toString();
  },

  *canonical({ base }) {
    let request = yield* CurrentRequest.expect();

    let requested = new URL(request.url);
    let canonical = new URL(base);

    canonical.pathname = `${canonical.pathname}${requested.pathname}`;

    return String(canonical);
  },
});

export const { url, canonical } = urlApi.operations;
