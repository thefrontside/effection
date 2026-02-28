import { type JSXElement, useParams } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { useAppHtml } from "./app.html.tsx";

import { ApiPage } from "../components/api/api-page.tsx";
import { usePackage } from "../lib/package.ts";
import { createSibling } from "../lib/links-resolvers.ts";

export function apiReferenceRoute(series: string, {
  search,
}: {
  search: boolean;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(generate) {
      let pkg = yield* usePackage({
        type: "worktree",
        series,
      });

      let docs = yield* pkg.docs();

      return docs["."]
        .map((node) => node.name)
        .flatMap((symbol) => {
          return [
            {
              pathname: generate({ symbol }),
            },
          ];
        });
    },
    handler: function* () {
      let { symbol } = yield* useParams<{ symbol: string }>();

      let pkg = yield* usePackage({
        type: "worktree",
        series,
      });

      let docs = yield* pkg.docs();

      let pages = docs["."];

      let page = pages.find((node) => node.name === symbol);

      if (!page) throw new Error(`Could not find a doc page for ${symbol}`);

      let AppHtml = yield* useAppHtml({
        title: `${symbol} | API Reference | Effection`,
        description: page.description,
      });

      return (
        <AppHtml search={search}>
          {yield* ApiPage({
            pages,
            current: symbol,
            pkg,
            externalLinkResolver: createSibling,
          })}
        </AppHtml>
      );
    },
  };
}
