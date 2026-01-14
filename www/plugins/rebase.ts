import type { RevolutionPlugin } from "revolution";
import { createContext, type Operation } from "effection";
import { posixNormalize } from "_posixNormalize";
import { selectAll } from "hast-util-select";
import { CurrentRequest } from "../context/request.ts";

const BaseUrl = createContext<URL>("baseUrl");

export function rebasePlugin(): RevolutionPlugin {
  return {
    *http(request, next) {
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
    },

    /**
     * Rebase an HTML document at a different URL. This replaces all `<a href>` and
     * `<img src>` attributes that contain an absolute path. Any path that is
     * relative or contains a fully qualitfied URL will be left alone.
     *
     * @param tree - the HTML tree to transform
     * @param baseUrl - a string representing a fully qualified url, e.g.
     *   http://frontside.com/effection
     */
    *html(request, next) {
      let tree = yield* next(request);

      let baseUrl = yield* BaseUrl.expect();
      let base = new URL(baseUrl);
      let elements = selectAll('[href^="/"],[src^="/"]', tree);

      for (let element of elements) {
        let properties = element.properties!;

        if (properties.href) {
          properties.href = posixNormalize(
            `${base.pathname}${properties.href}`,
          );
        }
        if (properties.src) {
          properties.src = posixNormalize(`${base.pathname}${properties.src}`);
        }
      }
      return tree;
    },
  };
}

/**
 * Convert a non fully qualified url into a fully qualified url, complete
 * with protocol.
 */
export function* useAbsoluteUrl(path: string): Operation<string> {
  let absolute = yield* useAbsoluteUrlFactory();
  return absolute(path);
}

export function* useAbsoluteUrlFactory(): Operation<(path: string) => string> {
  let base = yield* BaseUrl.expect();
  let request = yield* CurrentRequest.expect();

  return (path) => {
    let normalizedPath = posixNormalize(path);
    if (normalizedPath.startsWith("/")) {
      let url = new URL(base);
      url.pathname = posixNormalize(`${base.pathname}${path}`);
      return url.toString();
    } else {
      return new URL(path, request.url).toString();
    }
  };
}

/**
 * Get the canonical url for the current path.
 */
export function* useCanonicalUrl(options: { base: string; }): Operation<string> {
  let request = yield* CurrentRequest.expect()

  let req = new URL(request.url);
  let url = new URL(options.base);
  url.pathname = `${url.pathname}${req.pathname}`;
  return String(url);
}
