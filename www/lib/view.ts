import { posixNormalize } from "https://deno.land/std@0.203.0/path/_normalize.ts";
import { createContext, type Operation } from "effection";

const Outlet = createContext<JSX.Element>("outlet");

export const outlet: Operation<JSX.Element> = {
  *[Symbol.iterator]() {
    return yield* Outlet;
  },
};

export function* render(
  ...templates: Operation<JSX.Element>[]
): Operation<JSX.Element> {
  // won't be necessary when we migrate to HAST
  let content = null as unknown as JSX.Element;
  for (let template of templates.reverse()) {
    yield* Outlet.set(content);
    content = yield* template;
  }
  return content;
}

export const BaseUrl = createContext<URL>("baseUrl");

export function* useBaseUrl(): Operation<URL> {
  return yield* BaseUrl;
}

export const CurrentRequest = createContext<Request>("Request");

export function* useRequest() {
  return yield* CurrentRequest;
}

export function* useUrl(path: string): Operation<string> {
  let normalizedPath = posixNormalize(path);
  if (normalizedPath.startsWith("/")) {
    let base = yield* BaseUrl;
    let url = new URL(base);
    url.pathname = posixNormalize(`${base.pathname}${path}`);
    return url.toString();
  } else {
    let request = yield* useRequest();
    return new URL(path, request.url).toString();
  }
}
