import { all } from "effection";
import type { JSXElement } from "revolution";
import { GithubPill } from "../components/package/source-link.tsx";
import { useWorkspaces } from "../lib/workspaces/mod.ts";
import type { SitemapRoute } from "../plugins/sitemap.ts";
import { useAppHtml } from "./app.html.tsx";
import { createChildURL, createSibling } from "../lib/links-resolvers.ts";
import { softRedirect } from "./redirect.tsx";
import type { Package } from "../lib/package/types.ts";
import {
  groupPackagesByCategory,
  type PackageSummary,
} from "../lib/package/categories.ts";
import { useTaxonomy } from "../lib/package/taxonomy.ts";

type PackageEntry = PackageSummary & { url: string };

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
  search,
}: {
  search: boolean;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(gen) {
      return [{ pathname: gen() }];
    },
    *handler() {
      let workspaces = yield* useWorkspaces("thefrontside/effectionx");
      let categories = yield* useTaxonomy("thefrontside/effectionx");
      let packages = yield* workspaces.getAllPackages();

      let AppHTML = yield* useAppHtml({
        title: "Extensions | Effection",
        description:
          "List of community contributed modules that represent emerging consensus on how to do common JavaScript tasks with Effection.",
      });

      let makeChildUrl = createChildURL();

      // Resolve package metadata concurrently
      let packageEntries: PackageEntry[] = yield* all(
        packages.map(function* (pkg: Package) {
          let name = yield* pkg.getName();
          let description = yield* pkg.getDescription();
          let keywords = yield* pkg.getKeywords();
          let url = yield* makeChildUrl(pkg.workspaceName);

          return {
            name,
            description,
            workspaceName: pkg.workspaceName,
            keywords,
            url,
          };
        }),
      );

      // Group packages by category
      let categorizedPackages = groupPackagesByCategory(
        categories,
        packageEntries,
      );

      return (
        <AppHTML search={search}>
          <div class="flex flex-row gap-8 max-w-6xl mx-auto">
            {/* Sidebar */}
            <aside class="hidden lg:block w-48 flex-shrink-0 sticky top-24 self-start">
              <nav class="space-y-1">
                <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Categories
                </h2>
                <a
                  href="#frameworks"
                  class="block py-1.5 px-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  Frameworks
                </a>
                <div>
                  {categorizedPackages.map((category) => (
                    <a
                      href={`#${category.keyword}`}
                      class="block py-1.5 px-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      {category.label}{" "}
                      <span class="text-gray-400 dark:text-gray-500">
                        ({category.packages.length})
                      </span>
                    </a>
                  ))}
                </div>
              </nav>
            </aside>

            {/* Main content */}
            <article class="flex-1 prose dark:prose-invert bg-white dark:bg-gray-900 dark:text-gray-200 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
              <header class="flex flex-row items-center space-x-2">
                <h1 class="mb-0 text-gray-900 dark:text-gray-200">
                  Effection Extensions
                </h1>
                {yield* GithubPill({
                  url: workspaces.url,
                  text: workspaces.nameWithOwner,
                  class:
                    "flex flex-row w-fit h-10 items-center rounded-full bg-gray-200 dark:bg-gray-800 px-2 py-1 text-gray-900 dark:text-gray-100",
                })}
              </header>
              <p class="text-gray-800 dark:text-gray-200">
                A collection of reusable, community-created extensions - ranging
                from small packages to complete frameworks - that show the best
                practices for handling common JavaScript tasks with Effection.
              </p>

              {/* Frameworks section */}
              <section
                id="frameworks"
                class="scroll-mt-[100px] ring-1 ring-slate-300 dark:ring-slate-700 rounded"
              >
                <h2 class="p-4 bg-slate-100 dark:bg-gray-800 mb-0 text-lg text-gray-900 dark:text-gray-200">
                  Frameworks
                </h2>
                <ul class="list-none px-0 divide-y-1 divide-solid divide-slate-200 dark:divide-slate-700">
                  <li>
                    <a
                      href="http://starfx.bower.sh"
                      class="grid grid-flow-row no-underline pb-4 pt-4 px-4 text-cyan-700 dark:text-blue-400"
                    >
                      <span class="text-cyan-700 dark:text-blue-400 text-lg font-semibold">
                        StarFX
                      </span>
                      <span class="text-gray-800 dark:text-gray-200">
                        A micro-MVC framework for React App.
                      </span>
                    </a>
                  </li>
                </ul>
              </section>

              {/* Category sections */}
              <div class="space-y-4">
                {categorizedPackages.map((category) => (
                  <section
                    id={category.keyword}
                    class="scroll-mt-[100px] ring-1 ring-slate-300 dark:ring-slate-700 rounded"
                  >
                    <h2 class="p-4 bg-slate-100 dark:bg-gray-800 mb-0 text-lg text-gray-900 dark:text-gray-200">
                      {category.label}
                    </h2>
                    <ul class="list-none px-0 divide-y-1 divide-solid divide-slate-200 dark:divide-slate-700">
                      {category.packages.map((pkg) => (
                        <li>
                          <a
                            href={pkg.url}
                            class="grid grid-flow-row no-underline pb-4 pt-4 px-4 text-cyan-700 dark:text-blue-400"
                          >
                            <span class="text-cyan-700 dark:text-blue-400 text-lg font-semibold">
                              {pkg.name}
                            </span>
                            <span class="text-gray-800 dark:text-gray-200">
                              {pkg.description}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </article>
          </div>
        </AppHTML>
      );
    },
  };
}
