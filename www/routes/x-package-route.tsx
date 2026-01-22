import { call } from "effection";
import { shiftHeading } from "hast-util-shift-heading";
import type { Nodes } from "hast/";
import {
  type JSXElement, // @ts-types="revolution"
  respondNotFound,
  useParams,
} from "revolution";

import { select } from "hast-util-select";
import { ApiBody } from "../components/api/api-page.tsx";
import { PackageExports } from "../components/package/exports.tsx";
import { PackageHeader } from "../components/package/header.tsx";

import { Icon } from "../components/type/icon.tsx";
import { DocPageContext } from "../context/doc-page.ts";
import { useMarkdown } from "../hooks/use-markdown.tsx";
import { createToc } from "../lib/toc.ts";
import { useWorkspaces } from "../lib/workspaces/mod.ts";
import type { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";
import { useAppHtml } from "./app.html.tsx";
import { createSibling } from "../lib/links-resolvers.ts";
import { softRedirect } from "./redirect.tsx";

interface XPackageRouteParams {
  search: boolean;
}

function routemap(): SitemapRoute<JSXElement>["routemap"] {
  return function* (pathname) {
    let paths: RoutePath[] = [];

    let workspaces = yield* useWorkspaces("thefrontside/effectionx");
    let workspaceNames = yield* workspaces.listWorkspaces();

    for (let workspaceName of workspaceNames) {
      paths.push({
        pathname: pathname({
          workspacePath: workspaceName,
        }),
      });
    }

    return paths;
  };
}

export function xPackageRedirect(): SitemapRoute<JSXElement> {
  return {
    routemap: routemap(),
    *handler(req) {
      let params = yield* useParams<{ workspacePath: string }>();
      return yield* softRedirect(
        req,
        yield* createSibling(params.workspacePath),
      );
    },
  };
}

export function xPackageRoute({
  search,
}: XPackageRouteParams): SitemapRoute<JSXElement> {
  return {
    routemap: routemap(),
    *handler() {
      let params = yield* useParams<{ workspacePath: string }>();

      let workspaces = yield* useWorkspaces("thefrontside/effectionx");

      let pkg = yield* workspaces.getWorkspace(params.workspacePath);

      if (!pkg) {
        return yield* respondNotFound();
      }

      try {
        let docs = yield* pkg.getDocs();
        let pkgName = yield* pkg.getName();
        let pkgDescription = yield* pkg.getDescription();

        let AppHTML = yield* useAppHtml({
          title: `${pkgName} | Extensions | Effection`,
          description: pkgDescription,
        });

        let linkResolver = function* (
          symbol: string,
          connector?: string,
          method?: string,
        ) {
          let internal = `#${symbol}_${method}`;
          if (connector === "_") {
            return internal;
          }
          let page = docs["."].find(
            (page) => page.name === symbol && page.kind !== "import",
          );

          if (page) {
            // get internal link
            return `[${symbol}](#${page.kind}_${page.name})`;
          }

          return symbol;
        };

        let apiReference = [];

        let entrypoints = Object.entries(docs);

        for (let [entrypoint, pages] of entrypoints) {
          let sections = [];
          for (let page of pages) {
            let content = yield* call(function* () {
              yield* DocPageContext.set(page);
              return yield* ApiBody({ page, linkResolver });
            });
            sections.push(content);
          }
          if (entrypoint.length === 1 && entrypoint === ".") {
            apiReference.push(
              <section>
                <>{sections}</>
              </section>,
            );
          } else if (pages.length > 0) {
            apiReference.push(
              <section>
                <h1 id={entrypoint}>{entrypoint}</h1>
                <>{sections}</>
              </section>,
            );
          }
        }

        apiReference.forEach((section) => shiftHeading(section, 1));

        let content = (
          <>
            {yield* useMarkdown(yield* pkg.getReadme(), { linkResolver })}
            <h2 id="api-reference">API Reference</h2>
            <>{apiReference}</>
          </>
        );

        let toc = createToc(content, {
          headings: ["h2", "h3"],
          cssClasses: {
            toc:
              "hidden text-sm font-light tracking-wide leading-loose lg:block relative",
            link: "flex flex-row items-center",
          },
          customizeTOCItem(item, heading) {
            heading.properties.class = [
              heading.properties.class,
              `group grow scroll-mt-[100px]`,
            ]
              .filter(Boolean)
              .join("");

            let ol = select("ol.toc-level-2, ol.toc-level-3", item as Nodes);
            if (ol) {
              ol.properties.className = `${ol.properties.className} ml-6`;
            }
            if (
              heading.properties["data-kind"] &&
              heading.properties["data-name"]
            ) {
              item.properties.className += " mb-1";
              let a = select("a", item as Nodes);
              if (a) {
                // deno-lint-ignore no-explicit-any
                (a as any).children = [
                  <Icon class="-ml-6" kind={heading.properties["data-kind"]} />,
                  <span class="hover:underline hover:underline-offset-2">
                    {heading.properties["data-name"]}
                  </span>,
                ];
              }
            } else {
              let a = select("a", item as Nodes);
              if (a) {
                a.properties.className =
                  `hover:underline hover:underline-offset-2`;
              }
            }
            return item;
          },
        });

        return (
          <AppHTML search={search}>
            <>
              <div class="grid grid-cols-1 lg:grid-cols-10 gap-8 lg:gap-12">
                <article
                  data-pagefind-filter={`section: Extensions`}
                  class="min-w-0 lg:col-span-7 lg:row-start-1"
                >
                  {yield* PackageHeader(pkg)}
                  <div class="prose dark:prose-invert max-w-full">
                    <div class="mb-5">
                      {yield* PackageExports({
                        packageName: pkgName,
                        docs,
                        linkResolver,
                      })}
                    </div>
                    {content}
                  </div>
                </article>
                <aside class="xl:w-[260px] lg:col-[span_3/_-1] top-[120px] lg:sticky lg:max-h-screen flex flex-col box-border gap-y-4">
                  <div>
                    <div
                      aria-hidden="true"
                      class="hidden mb-1 lg:block text-sm font-bold"
                    >
                      On this page
                    </div>
                    {toc}
                  </div>
                </aside>
              </div>
            </>
          </AppHTML>
        );
      } catch (e) {
        console.error(e);
        let AppHTML = yield* useAppHtml({
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
