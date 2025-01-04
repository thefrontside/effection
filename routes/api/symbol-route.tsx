import type { Operation } from "effection";
import { type JSXElement, useParams } from "revolution";

import { Type } from "../../components/api.tsx";
import { DocPage, Icon } from "../../hooks/use-deno-doc.tsx";
import { useJsDocMarkdown } from "../../hooks/use-markdown.tsx";
import { SitemapRoute } from "../../plugins/sitemap.ts";
import { PackageDocs } from "../../resources/package.ts";
import { Repository } from "../../resources/repository.ts";
import { useAppHtml } from "../app.html.tsx";

function* getApiForLatestTag(
  repository: Repository,
  searchQuery: string,
): Operation<PackageDocs | undefined> {
  const latest = yield* repository.getLatestSemverTag(searchQuery);

  if (latest) {
    const ref = yield* repository.loadRef(`tags/${latest.name}`);
    const pkg = yield* ref.loadRootPackage();
    if (pkg) {
      return yield* pkg.docs();
    }
  }
}

export function apiSymbolRoute(library: Repository): SitemapRoute<JSXElement> {
  return {
    *routemap(generate) {
      const docs = yield* getApiForLatestTag(library, "effection-v3");

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
      // let { symbol, namespace } = parseParams(params);

      try {
        const docs = yield* getApiForLatestTag(library, "effection-v3");

        if (!docs) throw new Error(`Could not retreive docs`);

        const page = docs["."].find((node) => node.name === symbol);

        if (!page) throw new Error(`Could not find a doc page for ${symbol}`);

        const elements: JSXElement[] = [];
        if (page) {
          for (const section of page?.sections) {
            elements.push(
              <section>
                {yield* Type({ node: section.node })}
                {section.markdown ? (
                  <div class="pl-2 -mt-5">
                    {yield* useJsDocMarkdown(section.markdown)}
                  </div>
                ) : (
                  <></>
                )}
              </section>,
            );
          }
        }

        const AppHtml = yield* useAppHtml({
          title: `${symbol} | API Reference | Effection`,
          description: page.description,
        });

        return (
          <AppHtml>
            <section class="min-h-0 mx-auto w-full justify-items-normal md:grid md:grid-cols-[225px_auto] lg:grid-cols-[225px_auto_200px] md:gap-4">
              <aside class="min-h-0 overflow-auto hidden md:block pt-2 top-24 sticky h-fit">
                <nav class="pl-4">
                  <h3 class="text-lg">API Reference</h3>
                  <Menu pages={docs["."]} current={symbol} />
                </nav>
              </aside>
              <article class="prose max-w-full px-6 py-2">
                <h1>
                  {page.kind === "typeAlias" ? "type alias " : page.kind}{" "}
                  {page.name}
                </h1>
                <>{elements}</>
              </article>
            </section>
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

function Menu({ pages, current }: { current: string; pages: DocPage[] }) {
  return (
    <menu>
      {pages
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((page) => (
          <li>
            {current === page.name ? (
              <span class="rounded px-2 block w-full py-2 bg-gray-100 cursor-default ">
                <Icon kind={page.kind} />
                {page.name}
              </span>
            ) : (
              <a
                class="rounded px-2 block w-full py-2 hover:bg-gray-100"
                href={`/api/${page.name}`}
              >
                <Icon kind={page.kind} />
                {page.name}
              </a>
            )}
          </li>
        ))}
    </menu>
  );
}