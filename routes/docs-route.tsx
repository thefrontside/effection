import { Operation } from "effection";
import { type JSXElement, respondNotFound, useParams } from "revolution";

import { useDescription } from "../hooks/use-description-parse.tsx";
import { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";
import type { DocMeta, Docs } from "../resources/docs.ts";
import { useAppHtml } from "./app.html.tsx";
import { createSibling } from "./links-resolvers.ts";
import { Navburger } from "../components/navburger.tsx";

export function docsRoute({
  docs,
  search,
  series,
}: {
  docs: Docs;
  search: boolean;
  series: string;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      let paths: RoutePath[] = [];
      for (let doc of yield* docs.all()) {
        paths.push({
          pathname: pathname({ id: doc.id }),
        });
      }
      return paths;
    },
    *handler() {
      let { id } = yield* useParams<{ id: string }>();

      const doc = yield* docs.getDoc(id);

      if (!doc) {
        return yield* respondNotFound();
      }

      let { topics } = doc;

      const description = yield* useDescription(doc.markdown);

      let AppHtml = yield* useAppHtml({
        title: `${doc.title} | Docs | Effection`,
        description,
        hasLeftSidebar: true,
      });

      const topicsList = [];

      for (const topic of topics) {
        const items = [];
        for (const item of topic.items) {
          items.push(
            <li class="mt-1">
              {doc.id !== item.id
                ? (
                  <a
                    class="rounded px-4 block w-full py-2 hover:bg-gray-100"
                    href={yield* createSibling(item.id)}
                  >
                    {item.title}
                  </a>
                )
                : (
                  <a class="rounded px-4 block w-full py-2 bg-gray-100 cursor-default">
                    {item.title}
                  </a>
                )}
            </li>,
          );
        }
        topicsList.push(
          <hgroup class="mb-2">
            <h3 class="text-lg">{topic.name}</h3>
            <menu class="text-gray-700">{items}</menu>
          </hgroup>,
        );
      }

      return (
        <AppHtml search={search}>
          <section class="min-h-0 mx-auto w-full justify-items-normal md:grid md:grid-cols-[225px_auto] lg:grid-cols-[225px_auto_200px] md:gap-4">
            <input class="hidden" id="nav-toggle" type="checkbox" checked />
            <aside
              id="docbar"
              class="fixed top-0 h-full w-full grid grid-cols-2 md:hidden"
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
            <aside class="min-h-0 overflow-auto hidden md:block top-[120px] sticky h-fit">
              <nav class="pl-4">{topicsList}</nav>
            </aside>
            <article
              class="prose max-w-full px-6 py-2"
              data-pagefind-filter={`version[data-series], section:Guides`}
              data-series={series}
            >
              <h1>{doc.title}</h1>
              <>{doc.content}</>
              {yield* NextPrevLinks({ doc })}
            </article>
            <aside class="min-h-0 overflow-auto sticky h-fit hidden md:block top-[120px]">
              <h3>On this page</h3>
              <>{doc.toc}</>
            </aside>
          </section>
        </AppHtml>
      );
    },
  };
}

function* NextPrevLinks({
  doc,
}: {
  doc: DocMeta;
  base?: string;
}): Operation<JSXElement> {
  let { next, prev } = doc;
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
