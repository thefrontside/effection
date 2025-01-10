import type { Operation } from "effection";
import { type JSXElement, useParams } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { RepositoryRef } from "../resources/repository-ref.ts";
import { Repository } from "../resources/repository.ts";
import { useAppHtml } from "./app.html.tsx";

import { createSibling } from "./links-resolvers.ts";
import { ApiPage } from "../components/api/api-page.tsx";
import { DocsPages } from "../hooks/use-deno-doc.tsx";

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

        const page = pages.find((node) => node.name === symbol);

        if (!page) throw new Error(`Could not find a doc page for ${symbol}`);

        const AppHtml = yield* useAppHtml({
          title: `${symbol} | API Reference | Effection`,
          description: page.description,
        });

        return (
          <AppHtml>
            {
              yield* ApiPage({
                pages,
                current: symbol,
                ref,
                externalLinkResolver: function* (symbol) {
                  return yield* createSibling(symbol);
                },
              })
            }
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

