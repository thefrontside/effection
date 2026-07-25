import { type JSXElement } from "revolution";

import { ExperimentalBadge, Icon } from "../components/type/icon.tsx";
import { DocPage } from "../hooks/use-deno-doc.tsx";
import { ResolveLinkFunction } from "../hooks/use-markdown.tsx";
import { usePackage } from "../lib/package.ts";
import { gt } from "../lib/semver.ts";
import { SitemapRoute } from "../plugins/sitemap.ts";
import { useAppHtml } from "./app.html.tsx";
import { createChildURL } from "../lib/links-resolvers.ts";

export function apiIndexRoute(
  { search }: { search: boolean },
): SitemapRoute<JSXElement> {
  return {
    *routemap(gen) {
      return [{ pathname: gen() }];
    },
    handler: function* () {
      let v3 = yield* usePackage({
        type: "worktree",
        series: "v3",
      });

      let v4 = yield* usePackage({
        type: "worktree",
        series: "v4",
      });

      let v4Next = yield* usePackage({
        type: "worktree",
        series: "v4-next",
      });

      // Only show prerelease link if it's newer than stable
      let showV4Prerelease = gt(v4Next.version, v4.version);

      // v4-next docs feed the "also available" prerelease link. The
      // prerelease's own experimental APIs are surfaced when you click through
      // to its symbol pages (their sidebar lists them, badged).
      let v4NextDocs = yield* v4Next.docs();
      let v4NextFirstSymbol = v4NextDocs?.["."]?.[0]?.name ?? "run";

      let docs = {
        v3: yield* v3.docs(),
        v4: yield* v4.docs(),
      };

      let AppHtml = yield* useAppHtml({
        title: `API Reference | Effection`,
        description: `API Reference for Effection`,
      });

      return (
        <AppHtml search={search}>
          <article class="prose dark:prose-invert m-auto bg-white dark:bg-gray-900 dark:text-gray-200 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-a:text-blue-700 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
            <h1>API Reference</h1>
            <section>
              <h3 id={v4.version} class="group scroll-mt-[200px]">
                {v4.version}
                {showV4Prerelease && (
                  <span class="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                    ·{" "}
                    <a
                      href={`/api/v4-next/${v4NextFirstSymbol}`}
                      class="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {v4Next.version}
                    </a>{" "}
                    also available
                  </span>
                )}
                <a
                  href={`#${v4.version}`}
                  class="opacity-0 group-hover:opacity-100 after:content-['#'] after:ml-1.5 no-underline"
                >
                  <span class="icon icon-link" />
                </a>
              </h3>
              <ul class="columns-3 pl-0">
                {yield* listPages({
                  groups: [
                    {
                      pages: docs.v4["."],
                      linkResolver: createChildURL("v4"),
                      experimental: false,
                    },
                    {
                      // Experimental APIs for the stable release itself (empty
                      // until a stable version exports `./experimental`).
                      pages: docs.v4["./experimental"] ?? [],
                      linkResolver: createChildURL("v4/experimental"),
                      experimental: true,
                    },
                  ],
                })}
              </ul>
            </section>
            <hr />
            <section>
              <h3 id={v3.version} class="group scroll-mt-[200px]">
                {v3.version}
                <a
                  href={`#${v3.version}`}
                  class="opacity-0 group-hover:opacity-100 after:content-['#'] after:ml-1.5 no-underline"
                >
                  <span class="icon icon-link" />
                </a>
              </h3>
              <ul class="columns-3 pl-0">
                {yield* listPages({
                  groups: [
                    {
                      pages: docs.v3["."],
                      linkResolver: createChildURL("v3"),
                      experimental: false,
                    },
                    {
                      pages: docs.v3["./experimental"] ?? [],
                      linkResolver: createChildURL("v3/experimental"),
                      experimental: true,
                    },
                  ],
                })}
              </ul>
            </section>
          </article>
        </AppHtml>
      );
    },
  };
}

interface PageGroup {
  pages: DocPage[];
  linkResolver: ResolveLinkFunction;
  experimental: boolean;
}

function* listPages({ groups }: { groups: PageGroup[] }) {
  // Resolve links first (linkResolver is an Operation), then merge every
  // group into a single alphabetically-sorted list so experimental symbols
  // sit inline with stable ones, each carrying its own badge and link.
  let items: Array<{ page: DocPage; link: string; experimental: boolean }> = [];
  for (let group of groups) {
    for (let page of group.pages) {
      let link = yield* group.linkResolver(page.name);
      items.push({ page, link, experimental: group.experimental });
    }
  }

  items.sort((a, b) => a.page.name.localeCompare(b.page.name));

  let elements = [];
  for (let { page, link, experimental } of items) {
    elements.push(
      <li class="list-none pb-1">
        <a class="text-blue-700 dark:text-blue-400" href={link}>
          <Icon kind={page.kind} class="mr-2" />
          {page.name}
        </a>
        {experimental ? <ExperimentalBadge class="ml-2" /> : ""}
      </li>,
    );
  }
  return <>{elements}</>;
}
