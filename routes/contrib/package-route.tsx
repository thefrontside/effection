import { type JSXElement, useParams } from "revolution";

import { API } from "../../components/api.tsx";
import { PackageExports } from "../../components/package/exports.tsx";
import { PackageHeader } from "../../components/package/header.tsx";
import { ScoreCard } from "../../components/score-card.tsx";
import { useMarkdown } from "../../hooks/use-markdown.tsx";
import type { RoutePath, SitemapRoute } from "../../plugins/sitemap.ts";
import { Repository } from "../../resources/repository.ts";
import { useAppHtml } from "../app.html.tsx";
import { DocPage } from "../../hooks/use-deno-doc.tsx";

export function contribPackageRoute(
  contrib: Repository,
): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      let paths: RoutePath[] = [];

      const main = yield* contrib.loadRef();
      const { workspace = [] } = yield* main.loadDenoJson();

      for (let workspacePath of workspace) {
        paths.push({
          pathname: pathname({
            workspacePath: workspacePath.replace(/^\.\//, ""),
          }),
        });
      }

      return paths;
    },
    *handler() {
      const params = yield* useParams<{ workspacePath: string }>();

      try {
        const main = yield* contrib.loadRef();
        const pkg = yield* main.loadWorkspace(`./${params.workspacePath}`);

        const AppHTML = yield* useAppHtml({
          title: `${pkg.packageName} | Contrib | Effection`,
          description: yield* pkg.description(),
        });

        return (
          <AppHTML>
            <>
              <div class="grid grid-cols-1 lg:grid-cols-10 gap-8 lg:gap-12">
                <article class="min-w-0 lg:col-span-7 lg:row-start-1">
                  {yield* PackageHeader(pkg)}
                  <div class="prose max-w-full">
                    <div class="mb-5">{yield* PackageExports({ pkg, linkResolver })}</div>
                    {yield* useMarkdown(yield* pkg.readme())}
                    <h2 class="mb-0">API Reference</h2>
                    {yield* API(pkg)}
                  </div>
                </article>
                <aside class="lg:col-[span_3/_-1] lg:top-0 lg:sticky lg:max-h-screen flex flex-col box-border gap-y-4 -mt-4 pt-4">
                  {yield* ScoreCard(pkg)}
                </aside>
              </div>
            </>
          </AppHTML>
        );
      } catch (e) {
        console.error(e);
        const AppHTML = yield* useAppHtml({
          title: `${params.workspacePath} not found`,
          description: `Failed to load ${params.workspacePath} due to error.`,
        });
        return (
          <AppHTML>
            <p>Failed to load {params.workspacePath} due to error.</p>
          </AppHTML>
        );
      }
    },
  };
}

function* linkResolver(page: DocPage) {
  return `#${page.kind}_${page.name}`;
}