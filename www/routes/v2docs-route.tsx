import type { Middleware } from "revolution";
import type { V2Docs } from "../docs/v2-docs.ts";

import { call } from "effection";
import { concat, route } from "revolution";
import { serveTar } from "./serve-tar.ts";
import { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";

export function v2docsRoute(
  v2docs: V2Docs,
): SitemapRoute<Response> {
  let { apidocs, website } = v2docs;

  return {
    *routemap(pathname, request) {
      let paths: RoutePath[] = [];

      let entries = {
        website:
          yield* (request.headers.has("X-Base-Url")
            ? website.prod
            : website.local),
        apidocs: yield* apidocs,
      };

      for (let entry of entries.website.values()) {
        if (entry.type === "file" && entry.fileName.endsWith("index.html")) {
          let filename = entry.fileName.replace(/\/index.html$/, "").replace(
            /^site/,
            "",
          );
          paths.push({
            pathname: pathname({ "0": filename }),
          });
        }
      }

      for (let entry of entries.apidocs.values()) {
        if (entry.type === "file" && entry.fileName.endsWith(".html")) {
          let filename = entry.fileName.replace(/^api\/v2/, "/api");
          paths.push({
            pathname: pathname({ "0": filename }),
          });
        }
      }

      paths.push({
        pathname: pathname({ "0": "/dynamic-resources" }),
      });

      return paths;
    },
    handler: concat(
      route("/V2/dynamic-resources", function* (request) {
        let archive = yield* (request.headers.has("X-Base-Url")
          ? website.prod
          : website.local);

        let resources = [...archive.values()].flatMap(({ fileName }) => {
          if (fileName.endsWith(".js") || fileName.endsWith(".svg")) {
            return [fileName.replace(/^site\//, "")];
          } else {
            return [];
          }
        });

        return (
          <html>
            <head>
              {resources.map((path) => (
                <link rel="dynamic-resource" href={path} />
              ))}
            </head>
            <body>
              Dynamic Resources
              <ul>
                {resources.map((path) => (
                  <li>
                    <a href={path}>{path}</a>
                  </li>
                ))}
              </ul>
            </body>
          </html>
        );
      }) as unknown as Middleware<Request, Response>,
      route("/V2/api(.*)", function* (request) {
        return yield* call(serveTar(request, {
          tarRoot: "api/v2",
          urlRoot: "V2/api",
          entries: yield* apidocs,
        }));
      }),
      route("/V2(.*)", function* (request) {
        let entries = yield* (request.headers.has("X-Base-Url")
          ? website.prod
          : website.local);

        return yield* call(serveTar(request, {
          tarRoot: "site",
          urlRoot: "V2",
          entries,
        }));
      }),
    ),
  };
}
