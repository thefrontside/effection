import { Operation } from "effection";
import { CurrentRequest } from "../context/request.ts";
import { dirname, join } from "@std/path";
import { ResolveLinkFunction } from "../hooks/use-markdown.tsx";

/**
 * The API series being viewed, read from the current request. Symbol pages are
 * always `/api/<series>/…` (or `/api/<series>/experimental/…`), so the series
 * is the second path segment.
 */
export function* useApiSeries(): Operation<string> {
  let request = yield* CurrentRequest.expect();
  return new URL(request.url).pathname.split("/")[2];
}

export const createSibling: ResolveLinkFunction = function* (
  pathname,
  connector,
  method,
): Operation<string> {
  let request = yield* CurrentRequest.expect();
  let url = new URL(request.url);
  url.pathname = join(dirname(url.pathname), pathname);
  if (connector && method) {
    url.hash = `#${method}`;
  }
  return url.toString().replace(url.origin, "");
};

export function createChildURL(prefix?: string) {
  return function* (pathname: string): Operation<string> {
    let request = yield* CurrentRequest.expect();
    let url = new URL(request.url);
    url.pathname = join(
      "",
      ...[url.pathname, prefix, pathname].flatMap((s) => s ? [s] : []),
    );
    return url.toString().replace(url.origin, "");
  };
}

export function createRootUrl(prefix?: string) {
  return function* (pathname: string): Operation<string> {
    let request = yield* CurrentRequest.expect();
    let url = new URL(request.url);
    url.pathname = join("", ...[prefix, pathname].flatMap((s) => s ? [s] : []));
    return url.toString().replace(url.origin, "");
  };
}
