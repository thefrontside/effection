import { all, Operation } from "effection";
import { type JSXElement, respondNotFound, useParams } from "revolution";

import { useDescription } from "../hooks/use-description-parse.tsx";
import { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";
import { type GuidesMeta, useGuides } from "../resources/guides.ts";
import { useAppHtml } from "./app.html.tsx";
import {
  createChildURL,
  createRootUrl,
  createSibling,
} from "../lib/links-resolvers.ts";
import { Navburger } from "../components/navburger.tsx";
import { softRedirect } from "./redirect.tsx";
import { useConfig } from "../context/config.ts";

export function firstPage(series: string): () => Operation<string> {
  return function* () {
    let pages = yield* useGuides(series);

    let page = yield* pages.first();
    return yield* createChildURL()(page.id);
  };
}

export function guidesRoute({
  search,
}: {
  search: boolean;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      let { series } = yield* useConfig();
      // Only stable series have guides (no prereleases)
      let stableSeries = series.filter((s) => !s.includePrerelease);
      let paths = stableSeries.map(function* (s) {
        let paths: RoutePath[] = [];

        let pages = yield* useGuides(s.name);

        for (let page of yield* pages.all()) {
          paths.push({
            pathname: pathname({ id: page.id, series: s.name }),
          });
        }
        return paths;
      });
      return (yield* all(paths)).flat();
    },
    *handler(req) {
      let { series: allSeries, current } = yield* useConfig();
      // Only stable series have guides (no prereleases)
      let stableSeries = allSeries.filter((s) => !s.includePrerelease);

      let { id, series = current } = yield* useParams<{
        id: string | undefined;
        series: string | undefined;
      }>();

      let pages = yield* useGuides(series);

      if (!id) {
        let page = yield* pages.first();
        return yield* softRedirect(
          req,
          yield* createChildURL()(`${series}/${page.id}`),
        );
      }

      let page = yield* pages.get(id);

      if (!page) {
        return yield* respondNotFound();
      }

      let { topics } = page;

      let description = yield* useDescription(page.markdown);

      let AppHtml = yield* useAppHtml({
        title: `${page.title} | Docs | Effection`,
        description,
        hasLeftSidebar: true,
      });

      let topicsList = [];

      for (let topic of topics) {
        let items = [];
        for (let item of topic.items) {
          items.push(
            <li class="mt-1">
              {page.id !== item.id
                ? (
                  <a
                    class="rounded px-4 block w-full py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    href={yield* createSibling(item.id)}
                  >
                    {item.title}
                  </a>
                )
                : (
                  <a class="rounded px-4 block w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-default">
                    {item.title}
                  </a>
                )}
            </li>,
          );
        }
        topicsList.push(
          <hgroup class="mb-2">
            <h3 class="font-semibold text-gray-900 dark:text-gray-200">
              {topic.name}
            </h3>
            <menu class="text-gray-700 dark:text-gray-300">{items}</menu>
          </hgroup>,
        );
      }

      let versionToggle = yield* all(
        stableSeries.map(function* (s) {
          let target = yield* useGuides(s.name);
          let targetPage = yield* target.get(page.id);
          let base = current === s.name ? "docs" : `guides/${s.name}`;
          let url = yield* createRootUrl(base)(targetPage ? page.id : "/");
          return (
            <a
              href={url}
              class={`text-base ${
                s.name === series
                  ? "font-bold text-sky-500"
                  : "text-gray-600 dark:text-gray-400 hover:text-sky-500"
              }`}
            >
              {s.name}
            </a>
          );
        }),
      );

      return (
        <AppHtml search={search}>
          <section class="min-h-0 mx-auto w-full justify-items-normal md:grid md:grid-cols-[225px_auto] lg:grid-cols-[225px_auto_200px] md:gap-4">
            <input class="hidden" id="nav-toggle" type="checkbox" checked />
            <aside
              id="docbar"
              class="fixed top-0 h-full w-full grid grid-cols-2 md:hidden bg-white dark:bg-gray-900 dark:text-gray-200"
            >
              <nav class="bg-white dark:bg-gray-900 p-2 border-r-2 dark:border-gray-700 pt-24 min-h-0 h-full overflow-auto">
                {topicsList}
              </nav>
              <label
                for="nav-toggle"
                class="h-full w-full bg-gray-500 opacity-50"
              >
                <Navburger />
              </label>
              <style media="all">
                {`
      #nav-toggle:checked ~ aside#docbar {
  display: none;
      }
    `}
              </style>
            </aside>
            <aside class="min-h-0 overflow-auto hidden md:block top-30 sticky h-fit bg-white dark:bg-gray-900 dark:text-gray-200">
              <div class="text-xl flex flex-row items-baseline space-x-2 mb-3">
                <>
                  <span class="font-bold">Guides</span>
                  {...versionToggle}
                </>
              </div>
              <nav>{topicsList}</nav>
            </aside>
            <article
              class="prose max-w-full px-6 py-2 bg-white dark:bg-gray-900 dark:text-gray-200 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-a:text-blue-700 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100"
              data-pagefind-filter={`version[data-series], section:Guides`}
              data-series={series}
            >
              <h1>{page.title}</h1>
              {series !== current
                ? (
                  <div class="mb-4 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200">
                    You're viewing documentation for an older version. Effection
                    {current} is now available.{" "}
                    <a
                      href={yield* createRootUrl("docs")(page.id)}
                      class="font-medium text-sky-500 hover:underline"
                    >
                      View {current} docs →
                    </a>
                  </div>
                )
                : <></>}
              <>{page.content}</>
              {yield* NextPrevLinks({ page })}
            </article>
            <aside class="min-h-0 overflow-auto sticky h-fit hidden md:block top-[120px] bg-white dark:bg-gray-900 dark:text-gray-200">
              <h3 class="text-gray-900 dark:text-gray-200">On this page</h3>
              <div class="w-[200px] text-gray-800 dark:text-gray-200">
                {page.toc}
              </div>
            </aside>
          </section>
        </AppHtml>
      );
    },
  };
}

function* NextPrevLinks({ page }: { page: GuidesMeta }): Operation<JSXElement> {
  let { next, prev } = page;
  return (
    <menu class="grid grid-cols-2 my-10 gap-x-2 xl:gap-x-20 2xl:gap-x-40 text-lg">
      {prev
        ? (
          <li class="col-start-1 text-left font-light border-1 rounded-lg p-4">
            Previous
            <a
              class="py-2 block text-xl font-bold text-blue-primary no-underline tracking-wide leading-5 before:content-['«&nbsp;'] before:font-normal"
              href={yield* createSibling(prev.id)}
            >
              {prev.title}
            </a>
          </li>
        )
        : <li />}
      {next
        ? (
          <li class="col-start-2 text-right font-light border-1 rounded-lg p-4">
            Next
            <a
              class="py-2 block text-xl font-bold text-blue-primary no-underline tracking-wide leading-5 after:content-['&nbsp;»'] after:font-normal"
              href={yield* createSibling(next.id)}
            >
              {next.title}
            </a>
          </li>
        )
        : <li />}
    </menu>
  );
}
