import { type JSXElement, useParams } from "revolution";
import { call, type Operation } from "effection";
import { shiftHeading } from "npm:hast-util-shift-heading@4.0.0";
import type { Nodes } from "npm:@types/hast@3.0.4";

import { PackageExports } from "../components/package/exports.tsx";
import { PackageHeader } from "../components/package/header.tsx";
import { ScoreCard } from "../components/score-card.tsx";
import { DocPageContext } from "../context/doc-page.ts";
import { DocPage, DocsPages } from "../hooks/use-deno-doc.tsx";
import { useMarkdown } from "../hooks/use-markdown.tsx";
import { major, minor } from "../lib/semver.ts";
import type { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";
import { Repository } from "../resources/repository.ts";
import { useAppHtml } from "./app.html.tsx";
import { createToc } from "../lib/toc.ts";
import { ApiBody } from "../components/api/api-page.tsx";
import { select } from "npm:hast-util-select@6.0.1";
import { Icon } from "../components/type/icon.tsx";
import { softRedirect } from "./redirect.tsx";
import { createSibling } from "./links-resolvers.ts";
import { coerce, satisfies } from "npm:semver@7.6.3";

interface XPackageRouteParams {
  x: Repository;
  library: Repository;
  search: boolean;
}

function routemap(x: Repository): SitemapRoute<JSXElement>["routemap"] {
  return function* (pathname) {
    let paths: RoutePath[] = [];

    const main = yield* x.loadRef();
    const { workspace = [] } = yield* main.loadDenoJson();

    for (let workspacePath of workspace) {
      paths.push({
        pathname: pathname({
          workspacePath: workspacePath.replace(/^\.\//, ""),
        }),
      });
    }

    return paths;
  };
}

export function xPackageRedirect({
  x,
}: {
  x: Repository;
}): SitemapRoute<JSXElement> {
  return {
    routemap: routemap(x),
    *handler(req) {
      const params = yield* useParams<{ workspacePath: string }>();
      return yield* softRedirect(
        req,
        yield* createSibling(params.workspacePath),
      );
    },
  };
}

export function xPackageRoute({
  x,
  library,
  search,
}: XPackageRouteParams): SitemapRoute<JSXElement> {
  return {
    routemap: routemap(x),
    *handler() {
      const params = yield* useParams<{ workspacePath: string }>();

      try {
        const main = yield* x.loadRef();
        const pkg = yield* main.loadWorkspace(`./${params.workspacePath}`);
        const docs = yield* pkg.docs();

        const AppHTML = yield* useAppHtml({
          title: `${pkg.packageName} | Extensions | Effection`,
          description: yield* pkg.description(),
        });

        const linkResolver = function* (
          symbol: string,
          connector?: string,
          method?: string,
        ) {
          const internal = `#${symbol}_${method}`;
          if (connector === "_") {
            return internal;
          }
          const page = docs["."].find(
            (page) => page.name === symbol && page.kind !== "import",
          );

          let effection;
          if (page) {
            // get internal link
            return `[${symbol}](#${page.kind}_${page.name})`;
          } else {
            // get external link
            if (!effection) {
              const page = yield* DocPageContext.expect();
              effection = yield* getEffectionDependency(page, library);
            }
            if (effection && effection.docs && effection.version) {
              const page = effection.docs["."].find(
                (page) => page.name === symbol,
              );
              if (page) {
                return `[${symbol}](/api/${major(effection.version)}.${
                  minor(
                    effection.version,
                  )
                }/${symbol})`;
              }
            }
          }

          return symbol;
        };

        const apiReference = [];

        const entrypoints = Object.entries(docs);

        for (const [entrypoint, pages] of entrypoints) {
          const sections = [];
          for (const page of pages) {
            const content = yield* call(function* () {
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

        const content = (
          <>
            {yield* useMarkdown(yield* pkg.readme(), { linkResolver })}
            <h2 id="api-reference">API Reference</h2>
            <>{apiReference}</>
          </>
        );

        const toc = createToc(content, {
          headings: ["h2", "h3"],
          cssClasses: {
            toc:
              "hidden text-sm font-light tracking-wide leading-loose lg:block relative",
            link: "flex flex-row items-center",
          },
          customizeTOCItem(item, heading) {
            heading.properties.class = [
              heading.properties.class,
              `group scroll-mt-[100px]`,
            ]
              .filter(Boolean)
              .join("");

            const ol = select("ol.toc-level-2, ol.toc-level-3", item as Nodes);
            if (ol) {
              ol.properties.className = `${ol.properties.className} ml-6`;
            }
            if (
              heading.properties["data-kind"] &&
              heading.properties["data-name"]
            ) {
              item.properties.className += " mb-1";
              const a = select("a", item);
              if (a) {
                a.children = [
                  <Icon class="-ml-6" kind={heading.properties["data-kind"]} />,
                  <span class="hover:underline hover:underline-offset-2">
                    {heading.properties["data-name"]}
                  </span>,
                ];
              }
            } else {
              const a = select("a", item);
              a.properties.className =
                `hover:underline hover:underline-offset-2`;
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
                  <div class="prose max-w-full">
                    <div class="mb-5">
                      {yield* PackageExports({
                        packageName: pkg.packageName,
                        docs,
                        linkResolver,
                      })}
                    </div>
                    {content}
                  </div>
                </article>
                <aside class="xl:w-[260px] lg:col-[span_3/_-1] top-[120px] lg:sticky lg:max-h-screen flex flex-col box-border gap-y-4">
                  {yield* ScoreCard(pkg)}
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

function* getEffectionDependency(page: DocPage, library: Repository): Operation<{ version: string, docs: DocsPages } | undefined> {
  console.log(`Searching for effection dependency in page ${page.name}`);
  let effection = page.dependencies.find((dep) =>
    ["effection", "@effection/effection"].includes(dep.name)
  );
  if (effection) {
    const version = coerce(effection.version);
    if (version) {
      const versions = yield* library.getSemverTags(version.major.toString());
      if (versions) {
        let latest = versions.find(v => satisfies(v, effection.version));
        if (latest) {
          const ref = yield* library.loadRef(`tags/effection-v${latest}`);
          const pkg = yield* ref.loadRootPackage();
          if (pkg) {
            return {
              version: latest,
              docs: yield* pkg.docs()
            }
          } else {
            console.log(`Failed to load root package for version ${latest}`);
          }
        }
      }
    } else {
      console.log(`Failed to coerce version string: ${effection.version}`);
    }
  } else {
    console.log(`No effection dependency found in page ${page.name}`);
  }
}
