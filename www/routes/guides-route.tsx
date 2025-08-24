import { all, Operation } from "effection";
import { type JSXElement, respondNotFound, useParams } from "revolution";

import { useDescription } from "../hooks/use-description-parse.tsx";
import { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";
import { guides, type GuidesMeta } from "../resources/guides.ts";
import { useAppHtml } from "./app.html.tsx";
import { createChildURL, createSibling } from "./links-resolvers.ts";
import { Navburger } from "../components/navburger.tsx";
import { Repository } from "../resources/repository.ts";
import { softRedirect } from "./redirect.tsx";
import { IconExternal } from "../components/icons/external.tsx";

export function* getSeriesRef({
  repository,
  series,
}: {
  repository: Repository;
  series: string;
}) {
  const latest = yield* repository.getLatestSemverTag(`effection-${series}`);

  if (!latest) {
    throw new Error(`Could not retrieve latest tag for "effection-${series}"`);
  }

  return yield* repository.loadRef(`tags/${latest.name}`);
}

export function firstPage({
  repository,
  series,
}: {
  repository: Repository;
  series: string;
}) {
  return function* () {
    const ref = yield* getSeriesRef({ repository, series });
    const pages = yield* guides({ ref });

    const page = yield* pages.first();
    return yield* createChildURL()(page.id);
  };
}

const SERIES = ["v3", "v4"];
const STABLE_SERIES = "v3";

export function guidesRoute({
  search,
  repository,
}: {
  repository: Repository;
  search: boolean;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      const paths = SERIES.map(function* (series) {
        let paths: RoutePath[] = [];
        const ref = yield* getSeriesRef({ repository, series });
        const pages = yield* guides({ ref });

        for (let page of yield* pages.all()) {
          paths.push({
            pathname: pathname({ id: page.id, series }),
          });
        }
        return paths;
      });
      return (yield* all(paths)).flat();
    },
    *handler(req) {
      let { id, series = STABLE_SERIES } = yield* useParams<{
        id: string | undefined;
        series: string | undefined;
      }>();

      const ref = yield* repository.loadRef(`heads/${series}`);
      const pages = yield* guides({ ref });

      if (!id) {
        const page = yield* pages.first();
        return yield* softRedirect(
          req,
          yield* createChildURL()(`${series}/${page.id}`),
        );
      }

      const page = yield* pages.get(id);

      if (!page) {
        return yield* respondNotFound();
      }

      let { topics } = page;

      const description = yield* useDescription(page.markdown);

      let AppHtml = yield* useAppHtml({
        title: `${page.title} | Docs | Effection`,
        description,
        hasLeftSidebar: true,
      });

      const topicsList = [];

      for (const topic of topics) {
        const items = [];
        for (const item of topic.items) {
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

      const latest = yield* getSeriesRef({ repository, series });

      return (
        <AppHtml search={search}>
          <section class="min-h-0 mx-auto w-full justify-items-normal md:grid md:grid-cols-[225px_auto] lg:grid-cols-[225px_auto_200px] md:gap-4">
            <input class="hidden" id="nav-toggle" type="checkbox" checked />
            <aside
              id="docbar"
              class="fixed top-0 h-full w-full grid grid-cols-2 md:hidden bg-white dark:bg-gray-900 dark:text-gray-200"
            >
              <nav class="bg-white p-2 border-r-2 h-full pt-24 min-h-0 h-full overflow-auto">
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
            <aside class="min-h-0 overflow-auto hidden md:block top-[120px] sticky h-fit bg-white dark:bg-gray-900 dark:text-gray-200">
              <div class="text-xl flex flex-row items-baseline space-x-2 mb-3">
                <span class="font-bold">Guides</span>
                <a href={latest.url} class="text-base">
                  {series}{" "}
                  <IconExternal
                    class="inline-block align-baseline"
                    height="15"
                    width="15"
                  />
                </a>
              </div>
              <nav>{topicsList}</nav>
            </aside>
            <article
              class="prose max-w-full px-6 py-2 bg-white dark:bg-gray-900 dark:text-gray-200 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-a:text-blue-700 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100"
              data-pagefind-filter={`version[data-series], section:Guides`}
              data-series={series}
            >
              <h1>{page.title}</h1>
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
