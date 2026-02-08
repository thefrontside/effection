// @ts-nocheck - SVG elements not in JSX.IntrinsicElements
import type { JSXElement } from "revolution/jsx-runtime";

import { useBlog } from "../resources/blog.ts";
import { useAppHtml } from "./app.html.tsx";
import { AuthorSection } from "../components/blog/author-section.tsx";
import { getAuthorImage } from "../lib/get-author-image.ts";
import { SitemapRoute } from "../plugins/sitemap.ts";

export function blogIndexRoute({
  search,
}: {
  search: boolean;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      return [{ pathname: pathname({}) }];
    },
    *handler() {
      let blog = yield* useBlog();
      let posts = blog.getPosts();
      let [latest, ...rest] = posts;

      let AppHtml = yield* useAppHtml({
        title: "Blog | Effection",
        description:
          "Tutorials, announcements, and insights about structured concurrency in JavaScript with Effection.",
      });

      // If no posts yet, show a placeholder
      if (!latest) {
        return (
          <AppHtml search={search}>
            <div
              class="flex flex-col items-center justify-center py-20"
              data-pagefind-filter="section:Blog"
            >
              <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Blog
              </h1>
              <p class="text-gray-600 dark:text-gray-400">
                No posts yet. Check back soon!
              </p>
            </div>
          </AppHtml>
        );
      }

      return (
        <AppHtml search={search}>
          <div
            class="flex flex-col items-center max-w-6xl mx-auto"
            data-pagefind-filter="section:Blog"
          >
            {/* Header */}
            <header class="w-full text-center mb-12">
              <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Blog
              </h1>
              <p class="text-lg text-gray-600 dark:text-gray-400">
                Tutorials, announcements, and insights about structured
                concurrency
              </p>
            </header>

            {/* Featured Latest Post */}
            <section class="w-full mb-12">
              <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Latest
              </h2>
              <a
                href={`/blog/${latest.id}/`}
                class="block group rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div class="md:flex">
                  {latest.image
                    ? (
                      <div class="md:w-1/2">
                        <img
                          src={`/blog/${latest.id}/${latest.image}`}
                          alt={latest.title}
                          class="w-full h-64 md:h-full overflow-hidden dark:border dark:border-gray-700"
                          data-inline-svg
                        />
                      </div>
                    )
                    : (
                      <div class="md:w-1/2 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center h-64 md:h-auto">
                        <img
                          src="/assets/images/icon-effection.svg"
                          alt="Effection"
                          class="w-24 h-24 opacity-50"
                        />
                      </div>
                    )}
                  <div class="p-6 md:w-1/2 flex flex-col">
                    <span class="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-1 rounded mb-3 w-fit">
                      New
                    </span>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {latest.title}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4 flex-grow">
                      {latest.description}
                    </p>
                    <AuthorSection
                      author={latest.author}
                      date={latest.date}
                      authorImage={getAuthorImage(latest.author)}
                    />
                  </div>
                </div>
              </a>
            </section>

            {/* All Posts Grid */}
            {rest.length > 0
              ? (
                <section class="w-full">
                  <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-6">
                    All Posts
                  </h2>
                  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rest.map((post) => (
                      <a
                        href={`/blog/${post.id}/`}
                        class="group flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                      >
                        {post.image
                          ? (
                            <img
                              src={`/blog/${post.id}/${post.image}`}
                              alt={post.title}
                              class="w-full h-48 overflow-hidden dark:border dark:border-gray-700"
                              data-inline-svg
                            />
                          )
                          : (
                            <div class="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <img
                                src="/assets/images/icon-effection.svg"
                                alt="Effection"
                                class="w-16 h-16 opacity-50"
                              />
                            </div>
                          )}
                        <div class="p-5 flex flex-col flex-grow">
                          <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {post.title}
                          </h3>
                          <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-grow line-clamp-3">
                            {post.description}
                          </p>
                          <AuthorSection
                            author={post.author}
                            date={post.date}
                            authorImage={getAuthorImage(post.author)}
                          />
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              )
              : <></>}

            {/* RSS Feed Link */}
            <footer class="w-full mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
              <a
                href="/blog/feed.xml"
                class="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z" />
                  <path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1z" />
                  <circle cx="5" cy="15" r="2" />
                </svg>
                Subscribe via RSS
              </a>
            </footer>
          </div>
        </AppHtml>
      );
    },
  };
}
