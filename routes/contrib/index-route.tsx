import { all } from "effection";
import type { SitemapRoute } from "../../plugins/sitemap.ts";
import type { JSXElement } from "revolution";
import { useAppHtml } from "../app.html.tsx";
import { Repository } from "../../resources/repository.ts";

export function contribIndexRoute(
  contrib: Repository,
): SitemapRoute<JSXElement> {
  return {
    *routemap() {
      return [
        {
          pathname: "/",
        },
      ];
    },
    *handler() {
      const AppHTML = yield* useAppHtml({
        title: "Contrib | Effection",
        description:
          "List of community contributed modules that represent emerging consensus on how to do common JavaScript tasks with Effection.",
      });

      const ref = yield* contrib.loadRef();
      const packages = yield* ref.loadWorkspaces();

      return (
        <AppHTML>
          <article class="prose">
            <h1>Effection Contrib</h1>
            <p>
              Here are a list of community contributed modules that represent
              emerging consensus on how to do common JavaScript tasks with
              Effection.
            </p>
            <ul class="list-none px-0">
              {
                yield* all(
                  packages.map(function* (pkg) {
                    return (
                      <li class="px-0">
                        <h3>
                          <a href={`/contrib/${pkg.path}`}>
                            {pkg.packageName}
                          </a>
                        </h3>
                        <p>{yield* pkg.description()}</p>
                      </li>
                    );
                  }),
                )
              }
            </ul>
          </article>
        </AppHTML>
      );
    },
  };
}
