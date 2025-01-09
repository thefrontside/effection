import type { Operation } from "effection";
import { type JSXElement, useParams } from "revolution";

import { Type } from "../components/api.tsx";
import { Keyword } from "../components/tokens.tsx";
import {
  DocPage,
  DocPageLinkResolver,
  DocsPages,
  Icon,
} from "../hooks/use-deno-doc.tsx";
import {
  defaultLinkResolver,
  ResolveLinkFunction,
  useMarkdown,
} from "../hooks/use-markdown.tsx";
import { SitemapRoute } from "../plugins/sitemap.ts";
import { RepositoryRef } from "../resources/repository-ref.ts";
import { Repository } from "../resources/repository.ts";
import { useAppHtml } from "./app.html.tsx";
import { IconExternal } from "../components/icons/external.tsx";
import { extractVersion } from "../lib/semver.ts";
import { PackageSourceLink } from "../components/package/source-link.tsx";
import { Package } from "../resources/package.ts";

export function apiReferenceRoute({
  library,
  pattern,
}: {
  library: Repository;
  pattern: string;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(generate) {
      const [_ref, docs] = yield* getApiForLatestTag(library, pattern);

      if (docs) {
        return docs["."]
          .map((node) => node.name)
          .flatMap((symbol) => {
            return [
              {
                pathname: generate({ symbol }),
              },
            ];
          });
      } else {
        console.log(`Failed to load docs`);
      }

      return [];
    },
    handler: function* () {
      let { symbol } = yield* useParams<{ symbol: string }>();

      try {
        const [ref, docs] = yield* getApiForLatestTag(library, pattern);

        if (!ref) throw new Error(`Could not retrieve a tag for ${pattern}`);

        if (!docs) throw new Error(`Could not retreive docs`);

        const pages = docs["."];

        const page = docs["."].find((node) => node.name === symbol);

        if (!page) throw new Error(`Could not find a doc page for ${symbol}`);

        const internal: ResolveLinkFunction = function* resolve(
          symbol,
          connector,
          method,
        ) {
          if (pages && pages.find((page) => page.name === symbol)) {
            return yield* defaultLinkResolver(symbol, connector, method);
          } else {
            return symbol;
          }
        };

        const elements: JSXElement[] = [];
        if (page) {
          for (const [i, section] of Object.entries(page?.sections)) {
            if (section.markdown) {
              elements.push(
                <section
                  id={section.id}
                  class={`${i !== "0" ? "border-t-2" : ""} pb-7`}
                >
                  <h2 class="flex mt-7">
                    {yield* Type({ node: section.node })}
                  </h2>
                  <div class="[&>hr]:my-5 [&>p]:mb-0">
                    {
                      yield* useMarkdown(section.markdown, {
                        linkResolver: internal,
                      })
                    }
                  </div>
                </section>,
              );
            }
          }
        }

        const AppHtml = yield* useAppHtml({
          title: `${symbol} | API Reference | Effection`,
          description: page.description,
        });

        const pkg = yield* ref?.loadRootPackage();
        if (!pkg)
          throw new Error(`Fail to retrieve root package for ${ref.name}`);

        return (
          <AppHtml>
            <>
              {
                yield* ApiReference({
                  pages: docs["."],
                  current: symbol,
                  ref: ref,
                  content: (
                    <>
                      {yield* SymbolHeader({ pkg, page })}
                      <>{elements}</>
                    </>
                  ),
                  linkResolver: function* (page) {
                    return page.name;
                  },
                })
              }
            </>
          </AppHtml>
        );
      } catch (e) {
        console.error(e);
        const AppHTML = yield* useAppHtml({
          title: `${symbol} not found`,
          description: `Failed to load ${symbol} due to error.`,
        });
        return (
          <AppHTML>
            <p>Failed to load {symbol} due to error.</p>
          </AppHTML>
        );
      }
    },
  };
}

export function* getApiForLatestTag(
  repository: Repository,
  searchQuery: string,
): Operation<[RepositoryRef | undefined, DocsPages | undefined]> {
  const latest = yield* repository.getLatestSemverTag(searchQuery);

  if (latest) {
    const ref = yield* repository.loadRef(`tags/${latest.name}`);
    const pkg = yield* ref.loadRootPackage();
    if (pkg) {
      return [ref, yield* pkg.docs()];
    }
    return [ref, undefined];
  }

  return [undefined, undefined];
}

export function* ApiReference({
  ref,
  content,
  current,
  pages,
  linkResolver,
}: {
  ref: RepositoryRef;
  content: JSXElement;
  current: string;
  pages: DocPage[];
  linkResolver: DocPageLinkResolver;
}) {
  const version = extractVersion(ref?.name);

  return (
    <section class="min-h-0 mx-auto w-full justify-items-normal md:grid md:grid-cols-[225px_auto] lg:grid-cols-[225px_auto_200px] md:gap-4">
      <aside class="min-h-0 overflow-auto hidden md:block pt-2 top-24 sticky h-fit">
        <nav class="pl-4">
          <h3 class="text-xl flex flex-col mb-3">
            <span class="font-bold">API Reference</span>
            <span>
              <a href={ref.getUrl().toString()} class="font-semibold text-base">
                {version}{" "}
                <IconExternal
                  class="inline-block align-baseline"
                  height="15"
                  width="15"
                />
              </a>
            </span>
          </h3>
          {yield* Menu({ pages, current, linkResolver })}
        </nav>
      </aside>
      <article class="prose max-w-full px-6 py-2">{content}</article>
    </section>
  );
}

export function* SymbolHeader({ page, pkg }: { page: DocPage; pkg: Package }) {
  return (
    <header class="flex flex-row items-center space-x-2">
      <h1 class="mb-0">
        <Keyword>
          {page.kind === "typeAlias" ? "type alias " : page.kind}
        </Keyword>{" "}
        {page.name}
      </h1>
      {yield* PackageSourceLink({ pkg })}
    </header>
  );
}


function* Menu({
  pages,
  current,
  linkResolver,
}: {
  current: string;
  pages: DocPage[];
  linkResolver: DocPageLinkResolver;
}) {
  const elements = [];
  for (const page of pages.sort((a, b) => a.name.localeCompare(b.name))) {
    elements.push(
      <li>
        {current === page.name ? (
          <span class="rounded px-2 block w-full py-2 bg-gray-100 cursor-default ">
            <Icon kind={page.kind} />
            {page.name}
          </span>
        ) : (
          <a
            class="rounded px-2 block w-full py-2 hover:bg-gray-100"
            href={yield* linkResolver(page)}
          >
            <Icon kind={page.kind} />
            {page.name}
          </a>
        )}
      </li>,
    );
  }
  return <menu>{elements}</menu>;
}
