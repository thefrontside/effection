import type { HTTPMiddleware } from "revolution";
import { call, Operation } from "effection";

export interface ProxyRouteOptions {
  website: string;
  prefix: string;
  root?: string;
}

export function proxyRoute(options: ProxyRouteOptions): HTTPMiddleware {
  return function* proxy(request): Operation<Response> {
    let website = new URL(options.website);

    let target = new URL(request.url);

    let prefix = new RegExp(`^\/${options.prefix}\/?`);
    target.pathname = target.pathname.replace(prefix, options.root ?? "/");

    target.hostname = website.hostname;
    target.port = website.port;
    target.protocol = website.protocol;

    let base = new URL(`/${options.prefix}`, request.url);

    let headers: Record<string, string> = {
      "X-Base-Url": base.toString(),
    };
    for (let [key, value] of request.headers.entries()) {
      headers[key] = value;
    }

    let response = yield* call(fetch(target, {
      redirect: "manual",
      headers,
    }));

    if (response.status === 301) {
      let location = response.headers.get("location");
      if (location?.startsWith(String(website))) {
        let headers: Record<string, string> = {};
        for (let [key, value] of request.headers.entries()) {
          headers[key] = value;
        }

        let url = new URL(request.url);
        headers.location = location.replace(target.origin, url.origin);

        response = new Response(null, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }
    }

    return response;
  };
}
