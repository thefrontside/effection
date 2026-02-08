import { useParams } from "revolution";
import type { JSXElement } from "revolution/jsx-runtime";

import { useBlog } from "../resources/blog.ts";
import { useAppHtml } from "./app.html.tsx";
import { AuthorSection } from "../components/blog/author-section.tsx";
import { getAuthorImage } from "../lib/get-author-image.ts";
import { SitemapRoute } from "../plugins/sitemap.ts";

export function blogTagRoute({
  search,
}: {
  search: boolean;
}): SitemapRoute<JSXElement> {
  return {
    *routemap() {
      // Tags are dynamic based on posts, so we don't enumerate them in sitemap
      // Individual tag pages will still be crawlable via links
      return [];
    },
    *handler() {
      let { tag: tagParam } = yield* useParams<{ tag: string }>();
      let tag = decodeURIComponent(tagParam);

      let blog = yield* useBlog();
      let posts = blog.getPostsByTag(tag);

      let AppHtml = yield* useAppHtml({
        title: `Posts tagged "${tag}" | Blog | Effection`,
        description:
          `Blog posts about ${tag} - tutorials, announcements, and insights about structured concurrency in JavaScript.`,
      });

      return (
        <AppHtml search={search}>
          <div
            class="flex flex-col items-center max-w-6xl mx-auto"
            data-pagefind-filter="section:Blog"
          >
            {/* Header */}
            <header class="w-full text-center mb-12">
              <a
                href="/blog"
                class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 inline-block"
              >
                &larr; All Posts
              </a>
              <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Tag: {tag}
              </h1>
              <p class="text-lg text-gray-600 dark:text-gray-400">
                {posts.length} post{posts.length !== 1 ? "s" : ""} tagged with "
                {tag}"
              </p>
            </header>

            {/* Posts Grid */}
            {posts.length > 0
              ? (
                <section class="w-full">
                  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
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
              : (
                <div class="text-center py-12">
                  <p class="text-gray-600 dark:text-gray-400">
                    No posts found with this tag.
                  </p>
                </div>
              )}
          </div>
        </AppHtml>
      );
    },
  };
}
