import { all } from "effection";
import type { SitemapRoute } from "../plugins/sitemap.ts";
import type { JSXElement } from "revolution";
import { useAppHtml } from "./app.html.tsx";
import { Repository } from "../resources/repository.ts";
import { GithubPill } from "../components/package/source-link.tsx";
import { softRedirect } from "./redirect.tsx";
import { createChildURL, createSibling } from "./links-resolvers.ts";

export function xIndexRedirect(): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      return [{ pathname: pathname() }];
    },
    *handler(req) {
      return yield* softRedirect(req, yield* createSibling("x"));
    },
  };
}

export function xIndexRoute({
  x,
  search,
}: {
  x: Repository;
  search: boolean;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(gen) {
      return [{ pathname: gen() }];
    },
    *handler() {
      const AppHTML = yield* useAppHtml({
        title: "Extensions | Effection",
        description:
          "List of community contributed modules that represent emerging consensus on how to do common JavaScript tasks with Effection.",
      });

      const ref = yield* x.loadRef();
      const packages = yield* ref.loadWorkspaces();

      const makeChildUrl = createChildURL();

      return (
        <AppHTML search={search}>
          <article class="prose m-auto bg-white dark:bg-gray-900 dark:text-gray-200 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-a:text-cyan-700 dark:prose-a:text-cyan-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
            <header class="flex flex-row items-center space-x-2">
              <h1 class="mb-0 text-gray-900 dark:text-gray-200">
                Effection Extensions
              </h1>
              {yield* GithubPill({
                url: ref.getUrl().toString(),
                text: ref.repository.nameWithOwner,
                class:
                  "flex flex-row w-fit h-10 items-center rounded-full bg-gray-200 dark:bg-gray-800 px-2 py-1 text-gray-900 dark:text-gray-100",
              })}
            </header>
            <p class="text-gray-800 dark:text-gray-200">
              A collection of reusable, community-created extensions - ranging
              from small packages to complete frameworks - that show the best
              practices for handling common JavaScript tasks with Effection.
            </p>
            <section class="ring-1 ring-slate-300 dark:ring-slate-700 rounded">
              <h2 class="p-4 bg-slate-100 dark:bg-gray-800 mb-0 text-lg text-gray-900 dark:text-gray-200">
                Frameworks
              </h2>
              <ul class="list-none px-0 divide-y-1 divide-solid divide-slate-200 dark:divide-slate-700">
                <li>
                  <a
                    href="http://starfx.bower.sh"
                    class="grid grid-flow-row no-underline pb-4 pt-4 px-4 text-cyan-700 dark:text-cyan-400"
                  >
                    <span class="text-cyan-700 dark:text-cyan-400 text-lg font-semibold">
                      StarFX
                    </span>
                    <span class="text-gray-800 dark:text-gray-200">
                      A micro-MVC framework for React App.
                    </span>
                  </a>
                </li>
              </ul>
            </section>
            <section class="ring-1 ring-slate-300 dark:ring-slate-700 rounded">
              <h2 class="p-4 bg-slate-100 dark:bg-gray-800 mb-0 text-lg text-gray-900 dark:text-gray-200">
                Packages
              </h2>
              <ul class="list-none px-0 divide-y-1 divide-solid divide-slate-200 dark:divide-slate-700">
                {yield* all(
                  packages.map(function* (pkg) {
                    const [details] = yield* pkg.jsrPackageDetails();

                    let title;
                    let description;
                    if (details.success) {
                      title = `@${details.data.scope}/${details.data.name}`;
                      description = details.data.description;
                    } else {
                      title = pkg.path;
                      description = yield* pkg.description();
                    }

                    return (
                      <li>
                        <a
                          href={yield* makeChildUrl(pkg.path)}
                          class="grid grid-flow-row no-underline pb-4 pt-4 px-4 text-cyan-700 dark:text-cyan-400"
                        >
                          <span class="text-cyan-700 dark:text-cyan-400 text-lg font-semibold">
                            {title}
                          </span>
                          <span class="text-gray-800 dark:text-gray-200">
                            {description}
                          </span>
                        </a>
                      </li>
                    );
                  }),
                )}
              </ul>
            </section>
          </article>
        </AppHTML>
      );
    },
  };
}
