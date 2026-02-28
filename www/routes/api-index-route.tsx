import { type JSXElement } from "revolution";

import { Icon } from "../components/type/icon.tsx";
import { DocPage } from "../hooks/use-deno-doc.tsx";
import { ResolveLinkFunction } from "../hooks/use-markdown.tsx";
import { Package, usePackage } from "../lib/package.ts";
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
                <a
                  href={`#${v4.version}`}
                  class="opacity-0 group-hover:opacity-100 after:content-['#'] after:ml-1.5 no-underline"
                >
                  <span class="icon icon-link" />
                </a>
              </h3>
              {yield* PrereleaseNote({
                show: showV4Prerelease,
                pkg: v4Next,
                seriesPath: "v4-next",
              })}
              <ul class="columns-3 pl-0">
                {yield* listPages({
                  pages: docs.v4["."],
                  linkResolver: createChildURL("v4"),
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
                  pages: docs.v3["."],
                  linkResolver: createChildURL("v3"),
                })}
              </ul>
            </section>
          </article>
        </AppHtml>
      );
    },
  };
}

function* PrereleaseNote({
  show,
  pkg,
  seriesPath,
}: {
  show: boolean;
  pkg: Package;
  seriesPath: string;
}) {
  if (!show) {
    return <></>;
  }

  // Get the first symbol to link to
  let docs = yield* pkg.docs();
  let firstSymbol = docs["."]?.[0]?.name ?? "run";

  return (
    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">
      Also available:{" "}
      <a
        href={`/api/${seriesPath}/${firstSymbol}`}
        class="text-blue-600 dark:text-blue-400 hover:underline"
      >
        {pkg.version}
      </a>
    </p>
  );
}

function* listPages({
  pages,
  linkResolver,
}: {
  pages: DocPage[];
  linkResolver: ResolveLinkFunction;
}) {
  let elements = [];

  for (let page of pages.sort((a, b) => a.name.localeCompare(b.name))) {
    let link = yield* linkResolver(page.name);
    elements.push(
      <li class="list-none pb-1">
        <a class="text-blue-700 dark:text-blue-400" href={link}>
          <Icon kind={page.kind} class="mr-2" />
          {page.name}
        </a>
      </li>,
    );
  }
  return <>{elements}</>;
}
