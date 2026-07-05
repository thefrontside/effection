import { type JSXElement, useParams } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { useAppHtml } from "./app.html.tsx";

import { ApiPage } from "../components/api/api-page.tsx";
import { usePackage } from "../lib/package.ts";

function ExperimentalNotice(): JSXElement {
  return (
    <div class="not-prose border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/40 pl-4 pr-3 py-2 mb-6 rounded-r">
      <p class="font-bold text-amber-700 dark:text-amber-300 my-0">
        Experimental
      </p>
      <p class="text-amber-800 dark:text-amber-200 my-0 text-sm">
        This API is exported from <code>@effection/effection/experimental</code>
        {" "}
        and may change or be removed in a future release.
      </p>
    </div>
  );
}

export function apiReferenceRoute(series: string, {
  search,
  entrypoint = ".",
}: {
  search: boolean;
  entrypoint?: string;
}): SitemapRoute<JSXElement> {
  let isExperimental = entrypoint === "./experimental";
  return {
    *routemap(generate) {
      let pkg = yield* usePackage({
        type: "worktree",
        series,
      });

      let docs = yield* pkg.docs();

      return (docs[entrypoint] ?? [])
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

      let stablePages = docs["."] ?? [];
      let experimentalPages = docs["./experimental"] ?? [];

      // The sidebar lists stable + experimental symbols together (experimental
      // ones badged); the current symbol is resolved within its own entrypoint.
      let pages = [...stablePages, ...experimentalPages];

      let page = (isExperimental ? experimentalPages : stablePages).find(
        (node) => node.name === symbol,
      );

      if (!page) throw new Error(`Could not find a doc page for ${symbol}`);

      let AppHtml = yield* useAppHtml({
        title: `${symbol} | API Reference | Effection`,
        description: page.description,
      });

      return (
        <AppHtml search={search}>
          {yield* ApiPage({
            pages,
            current: page,
            pkg,
            banner: isExperimental ? <ExperimentalNotice /> : undefined,
          })}
        </AppHtml>
      );
    },
  };
}
