// @ts-nocheck - SVG elements not in JSX.IntrinsicElements
import { respondNotFound, useParams } from "revolution";
import type { JSXElement } from "revolution/jsx-runtime";

import { useBlog } from "../resources/blog.ts";
import { useAppHtml } from "./app.html.tsx";
import { AuthorSection } from "../components/blog/author-section.tsx";
import { getAuthorImage } from "../lib/get-author-image.ts";
import { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";
import { CurrentRequest } from "../context/request.ts";
import { softRedirect } from "./redirect.tsx";

export function blogPostRoute({
  search,
}: {
  search: boolean;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      let blog = yield* useBlog();
      let posts = blog.getPosts();
      let paths: RoutePath[] = posts.map((post) => ({
        pathname: pathname({ id: post.id }) + "/",
      }));
      return paths;
    },
    *handler() {
      let request = yield* CurrentRequest.expect();
      let { id } = yield* useParams<{ id: string }>();

      // Ensure trailing slash for relative asset paths to work
      let url = new URL(request.url);
      if (!url.pathname.endsWith("/")) {
        return yield* softRedirect(request, `${url.pathname}/`);
      }

      let blog = yield* useBlog();
      let post = blog.get(id);

      if (!post) {
        return yield* respondNotFound();
      }

      let AppHtml = yield* useAppHtml({
        title: `${post.title} | Blog | Effection`,
        description: post.description,
        image: `/blog/${post.id}/${
          post.image.replace(/\.svg$/, ".png")
        }?w=2400&h=1260`,
      });

      return (
        <AppHtml search={search}>
          <article
            class="max-w-4xl mx-auto"
            data-pagefind-filter="section:Blog"
          >
            {/* Header */}
            <header class="mb-8 text-center">
              <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                {post.title}
              </h1>

              {/* Author and Date */}
              <div class="flex justify-center mb-6">
                <AuthorSection
                  author={post.author}
                  date={post.date}
                  authorImage={getAuthorImage(post.author)}
                />
              </div>

              {/* Tags */}
              {post.tags.length > 0
                ? (
                  <div class="flex flex-wrap justify-center gap-2 mb-8">
                    {post.tags.map((tag) => (
                      <a
                        href={`/blog/tags/${encodeURIComponent(tag)}`}
                        class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
                      >
                        {tag}
                      </a>
                    ))}
                  </div>
                )
                : <></>}

              {/* Featured Image */}
              {post.image
                ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    class="w-full rounded-xl shadow-lg mb-8 overflow-hidden dark:border dark:border-gray-700"
                    data-inline-svg
                  />
                )
                : <></>}
            </header>

            {/* Content */}
            <section class="prose lg:prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-a:text-blue-700 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-gray-800 dark:prose-code:text-gray-200">
              <link rel="stylesheet" href="/assets/prism-atom-one-dark.css" />
              <post.content />
            </section>

            {/* Footer */}
            <footer class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div class="flex justify-between items-center">
                <a
                  href="/blog"
                  class="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  &larr; Back to Blog
                </a>
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
                  RSS
                </a>
              </div>
            </footer>
          </article>
        </AppHtml>
      );
    },
  };
}
