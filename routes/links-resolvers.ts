import { Operation } from "effection";
import { DocPage } from "../hooks/use-deno-doc.tsx";
import { CurrentRequest } from "../context/request.ts";
import { dirname, join } from "jsr:@std/path@^1.0.8";

export function createAPIReferenceLinkResolver(version: string) {
  return function* (doc: DocPage) {
    return `/api/${version}/${doc.name}`;
  };
}

export const v3Links = createAPIReferenceLinkResolver("v3");
export const v4Links = createAPIReferenceLinkResolver("v4");

export function* createSibling(pathname: string): Operation<string> {
  const request = yield* CurrentRequest.expect();
  const url = new URL(request.url);
  url.pathname = join(dirname(url.pathname), pathname);
  return url.toString();
}
