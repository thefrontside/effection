import { type Operation } from "effection";
import { posixNormalize } from "_posixNormalize";
import { type Api, createApi } from "@effectionx/context-api";
import { CurrentRequest } from "./request.ts";

export interface UrlApi {
  /**
   * Where the site says it lives: the origin every page names as the
   * original, whatever origin actually served it. `main` supplies it from
   * configuration; `urlApi.around` can rebase it for a narrower scope.
   */
  base: string;

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
   * but every copy names the same original.
   */
  canonical(): Operation<string>;
}

// annotated, because `canonical` reads `base` back through the api
export const urlApi: Api<UrlApi> = createApi<UrlApi>("url", {
  base: "https://frontside.com/effection",

  *url(path) {
    let request = yield* CurrentRequest.expect();
    let absolute = new URL(path, new URL(request.url).origin);

    absolute.pathname = posixNormalize(absolute.pathname);

    return absolute.toString();
  },

  *canonical() {
    let request = yield* CurrentRequest.expect();
    // through the api, so that an override of `base` reaches here too
    let base = yield* urlApi.operations.base;

    let requested = new URL(request.url);
    let original = new URL(base);

    // normalized, because a base without a path contributes its own "/"
    original.pathname = posixNormalize(
      `${original.pathname}${requested.pathname}`,
    );

    return String(original);
  },
});

export const { base, canonical, url } = urlApi.operations;
