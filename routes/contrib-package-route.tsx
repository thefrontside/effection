import { type JSXElement, useParams } from "revolution";
import { call, type Operation } from "effection";

import { PackageExports } from "../components/package/exports.tsx";
import { PackageHeader } from "../components/package/header.tsx";
import { ScoreCard } from "../components/score-card.tsx";
import { DocPageContext } from "../context/doc-page.ts";
import { DocPage } from "../hooks/use-deno-doc.tsx";
import { ResolveLinkFunction, useMarkdown } from "../hooks/use-markdown.tsx";
import { major, minor } from "../lib/semver.ts";
import type { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";
import { Repository } from "../resources/repository.ts";
import { useAppHtml } from "./app.html.tsx";
import { shiftHeadings } from "../lib/shift-headings.ts";
import { Package } from "../resources/package.ts";
import { Type } from "../components/type/jsx.tsx";
import { NO_DOCS_AVAILABLE } from "../components/type/markdown.tsx";
import { SourceCodeIcon } from "../components/icons/source-code.tsx";

interface ContribPackageRouteParams {
  contrib: Repository;
  library: Repository;
  search: boolean;
}

export function contribPackageRoute({
  contrib,
  library,
  search,
}: ContribPackageRouteParams): SitemapRoute<JSXElement> {
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
        const docs = yield* pkg.docs();

        const AppHTML = yield* useAppHtml({
          title: `${pkg.packageName} | Contrib | Effection`,
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
            if (effection.docs && effection.version) {
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

        return (
          <AppHTML search={search}>
            <>
              <div class="grid grid-cols-1 lg:grid-cols-10 gap-8 lg:gap-12">
                <article
                  data-pagefind-filter={`section: Contrib`}
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
                    {yield* useMarkdown(yield* pkg.readme(), { linkResolver })}
                    <h2 class="mb-0">API Reference</h2>
                    {yield* API({ pkg, linkResolver, library })}
                  </div>
                </article>
                <aside class="lg:col-[span_3/_-1] top-[120px] lg:sticky lg:max-h-screen flex flex-col box-border gap-y-4">
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

interface APIOptions {
  pkg: Package;
  linkResolver: ResolveLinkFunction;
  library: Repository;
}

export function* API({
  pkg,
  linkResolver,
  library,
}: APIOptions): Operation<JSXElement> {
  const elements: JSXElement[] = [];
  const docs = yield* pkg.docs();

  for (const exportName of Object.keys(docs)) {
    const pages = docs[exportName];
    const withoutImports = pages.flatMap((page) =>
      page.kind === "import" ? [] : [page]
    );
    for (const page of withoutImports) {
      const effection = yield* getEffectionDependency(page, library);
      for (const section of page.sections) {
        elements.push(
          <section
            id={section.id}
            data-series={effection.version
              ? `v${major(effection.version)}`
              : ""}
            class="flex flex-col border-b-2 pb-5"
          >
            <div class="flex group">
              <h3 class="grow">{yield* Type({ node: section.node })}</h3>
              <a
                class="mt-8 opacity-0 before:content-['View_code'] group-hover:opacity-100 before:flex before:text-xs before:mr-1 hover:bg-gray-100 p-2 flex-none flex rounded no-underline items-center h-8"
                href={`${section.node.location.filename}#L${section.node.location.line}`}
              >
                <SourceCodeIcon />
              </a>
            </div>
            <div class="[&>h3:first-child]:mt-0 [&>hr]:my-5 [&>h5]:font-semibold">
              {yield* call(function* () {
                yield* DocPageContext.set(page);
                return yield* useMarkdown(
                  section.markdown || NO_DOCS_AVAILABLE,
                  {
                    remarkPlugins: [[shiftHeadings, 1]],
                    linkResolver,
                    slugPrefix: section.id,
                  },
                );
              })}
            </div>
          </section>,
        );
      }
    }
  }

  return <>{elements}</>;
}

function* getEffectionDependency(page: DocPage, library: Repository) {
  let version, docs;
  let effection = page.dependencies.find((dep) =>
    ["effection", "@effection/effection"].includes(dep.name)
  );
  if (effection) {
    version = effection.version.replace("^", "");
    const ref = yield* library.loadRef(`tags/effection-v${version}`);
    const pkg = yield* ref.loadRootPackage();
    if (pkg) {
      docs = yield* pkg?.docs();
    }
  }
  return { version, docs };
}
