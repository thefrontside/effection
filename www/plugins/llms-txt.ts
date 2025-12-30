import type { RevolutionPlugin } from "revolution";
import { match } from "path-to-regexp";
import { getLlmsTxtHandlers } from "./sitemap.ts";

/**
 * Plugin that serves llms.txt content for routes that opt-in.
 * Routes register their llms.txt handlers via the llmstxt property in SitemapRoute.
 * Each route serves its llms.txt at {pattern}/llms.txt
 */
export function llmsTxtPlugin(): RevolutionPlugin {
  return {
    *http(request, next) {
      let url = new URL(request.url);

      // Only intercept paths ending with /llms.txt
      if (!url.pathname.endsWith("/llms.txt")) {
        return yield* next(request);
      }

      // Extract the base path (everything before /llms.txt)
      let basePath = url.pathname.slice(0, -"/llms.txt".length);

      // Skip root /llms.txt - let static files handle it
      if (basePath === "" || basePath === "/") {
        return yield* next(request);
      }

      // Check registered handlers
      for (let { pattern, handler } of getLlmsTxtHandlers()) {
        let matcher = match(pattern, { decode: decodeURIComponent });
        let result = matcher(basePath);

        if (result) {
          let content = yield* handler(
            result.params as Record<string, string>,
            request,
          );

          if (content !== null) {
            return new Response(content, {
              status: 200,
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
              },
            });
          }
        }
      }

      // No matching handler - pass to next
      return yield* next(request);
    },
  };
}
