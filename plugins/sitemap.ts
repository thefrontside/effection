import type { Middleware, RevolutionPlugin } from "revolution";
import { route as revolutionRoute, useRevolutionOptions } from "revolution";
import type { Operation } from "effection";
import { stringify } from "jsr:@libs/xml";
import { compile } from "https://deno.land/x/path_to_regexp@v6.2.1/index.ts";
import { useAbsoluteUrlFactory } from "./rebase.ts";

export function sitemapPlugin(): RevolutionPlugin {
  return {
    *http(request, next) {
      let options = yield* useRevolutionOptions();
      let url = new URL(request.url);

      if (url.pathname === "/sitemap.xml") {
        let app = options.app ?? [];
        let paths: RoutePath[] = [];
        for (let middleware of app) {
          let ext = middleware as SitemapExtension;
          if (ext.sitemapExtension) {
            paths = paths.concat(yield* ext.sitemapExtension(request));
          }
        }

        let absolute = yield* useAbsoluteUrlFactory();

        let xml = stringify({
          "@version": "1.0",
          "@encoding": "UTF-8",
          urlset: {
            "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
            url: paths.map((path) => {
              let { pathname, ...entry } = path;

              return {
                loc: absolute(pathname),
                ...entry,
              };
            }),
          },
        });

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml",
          },
        });
      }
      return yield* next(request);
    },
  };
}

export interface SitemapExtension {
  sitemapExtension?(request: Request): Operation<RoutePath[]>;
}

export interface RoutePath {
  pathname: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

/**
 * Just like a route, but generates a sitemap for all the urls
 */
export interface SitemapRoute<T> {
  /**
   * The HTTP or HTML handler for this route
   */
  handler: Middleware<Request, T>;

  /**
   * Generate a list of paths for this route. It will be passed a function which
   * will substitute in the parameters of the route to generate the path as a string.
   * For example:
   *
   * ```ts
   * // assuming a route pattern:  "/users/:username"
   * generate({ username: 'cowboyd' }) //=> "/users/cowboyd"
   * ```
   * @param generate - a function to generate a single pathname
   * @param request - the request for the sitemap
   * @returns a list of `RoutePath` values
   */
  routemap?(
    generate: (params?: Record<string, string>) => string,
    request: Request,
  ): Operation<RoutePath[]>;
}

export function route<T>(
  pattern: string,
  middleware: Middleware<Request, T> | SitemapRoute<T>,
): Middleware<Request, T> {
  if (isSitemapRoute<T>(middleware)) {
    let handler = revolutionRoute(pattern, middleware.handler);
    if (middleware.routemap) {
      const { routemap } = middleware;
      Object.defineProperty(handler, "sitemapExtension", {
        value(request: Request) {
          let generate = compile(pattern);
          return routemap(generate, request);
        },
      });
    }
    return handler;
  } else {
    return revolutionRoute(pattern, middleware);
  }
}

function isSitemapRoute<T>(
  o: Middleware<Request, T> | SitemapRoute<T>,
): o is SitemapRoute<T> {
  return !!(o as SitemapRoute<T>).handler;
}
