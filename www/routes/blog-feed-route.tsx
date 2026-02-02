import type { Operation } from "effection";

import { useBlog } from "../resources/blog.ts";

/**
 * RSS 2.0 feed for the blog
 */
export function blogFeedRoute() {
  return {
    *handler(): Operation<Response> {
      let blog = yield* useBlog();
      let posts = blog.getPosts();

      let baseUrl = "https://frontside.com/effection";

      let items = posts
        .slice(0, 20) // Limit to 20 most recent posts
        .map((post) => {
          let postUrl = `${baseUrl}/blog/${post.id}/`;
          let pubDate = post.date.toUTCString();

          return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <author>${post.author}</author>
      ${
            post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`)
              .join("\n      ")
          }
    </item>`;
        })
        .join("\n");

      let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Effection Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Tutorials, announcements, and insights about structured concurrency in JavaScript with Effection.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

      return new Response(rss, {
        headers: {
          "Content-Type": "application/rss+xml; charset=utf-8",
        },
      });
    },
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
