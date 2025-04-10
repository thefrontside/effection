import { all } from "effection";
import type { SitemapRoute } from "../plugins/sitemap.ts";
import type { JSXElement } from "revolution";
import { useAppHtml } from "./app.html.tsx";
import { Repository } from "../resources/repository.ts";
import { GithubPill } from "../components/package/source-link.tsx";
import { softRedirect } from "./redirect.tsx";
import { createChildURL, createSibling } from "./links-resolvers.ts";

export function contribIndexRedirect(): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      return [{ pathname: pathname() }];
    },
    *handler(req) {
      return yield* softRedirect(req, yield* createSibling("x"));
    },
  };
}

export function contribIndexRoute({
  contrib,
  search,
}: {
  contrib: Repository;
  search: boolean;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(gen) {
      return [{ pathname: gen() }];
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
        <AppHTML search={search}>
          <article class="prose m-auto">
            <header class="flex flex-row items-center space-x-2">
              <h1 class="mb-0">Effection Contrib</h1>
              {
                yield* GithubPill({
                  url: ref.getUrl().toString(),
                  text: ref.repository.nameWithOwner,
                })
              }
            </header>
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
                          <a href={yield* createChildURL()(pkg.path)}>
                            {yield* pkg.title()}
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
