import { all, type Operation } from "effection";
import { stringify } from "@libs/xml";

import { useBlog } from "../resources/blog.ts";
import { url } from "../context/url.ts";

/**
 * RSS 2.0 feed for the blog
 */
export function blogFeedRoute() {
  return {
    *handler(): Operation<Response> {
      let blog = yield* useBlog();
      let posts = blog.getPosts();
      let blogUrl = yield* url("/blog");
      let feed = yield* url("/blog/feed.xml");
      let items = yield* all(
        posts.slice(0, 20).map(function* (post) {
          let postUrl = yield* url(`/blog/${post.id}/`);

          return {
            title: post.title,
            link: postUrl,
            guid: {
              "@isPermaLink": "true",
              "#text": postUrl,
            },
            description: post.description,
            pubDate: post.date.toUTCString(),
            author: post.author,
            category: post.tags,
          };
        }),
      );

      let xml = stringify({
        "@version": "1.0",
        "@encoding": "UTF-8",
        rss: {
          "@version": "2.0",
          "@xmlns:atom": "http://www.w3.org/2005/Atom",
          channel: {
            title: "Effection Blog",
            link: blogUrl,
            description:
              "Tutorials, announcements, and insights about structured concurrency in JavaScript with Effection.",
            language: "en-us",
            lastBuildDate: new Date().toUTCString(),
            "atom:link": {
              "@href": feed,
              "@rel": "self",
              "@type": "application/rss+xml",
            },
            item: items,
          },
        },
      });

      return new Response(xml, {
        headers: {
          "Content-Type": "application/rss+xml; charset=utf-8",
        },
      });
    },
  };
}
