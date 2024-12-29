import { all } from "effection";
import type { SitemapRoute } from "../plugins/sitemap.ts";
import type { JSXElement } from "revolution";
import { PackageIndexItem } from "../components/index/item.tsx";
import { readPackages } from "../hooks/read-packages.ts";
import { useAppHtml } from "./app.html.tsx";
import { useRepository } from "../hooks/use-repository.ts";

export function indexRoute(): SitemapRoute<JSXElement> {
  return {
    *routemap() {
      return [{
        pathname: "/",
      }];
    },
    *handler() {
      const AppHTML = yield* useAppHtml({
        title: "Contrib | Effection",
        description:
          "List of community contributed modules that represent emerging consensus on how to do common JavaScript tasks with Effection.",
        pageTitle: "Contrib | Effection",
      });

      const repository = yield* useRepository();

      let configs = yield* readPackages({
        excludePrivate: true,
        base: repository.location,
      });

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
              {yield* all(
                configs.map((config) => PackageIndexItem({ config })()),
              )}
            </ul>
          </article>
        </AppHTML>
      );
    },
  };
}
