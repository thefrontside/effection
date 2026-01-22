import { type JSXElement, useParams } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { useGuides } from "../resources/guides.ts";
import { createRootUrl } from "../lib/links-resolvers.ts";
import { softRedirect } from "./redirect.tsx";

export function redirectDocsRoute(series: string): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      let pages = yield* useGuides(series);

      let paths = [];
      for (let page of yield* pages.all()) {
        paths.push({
          pathname: pathname({ id: page.id, series }),
        });
      }

      return paths;
    },
    *handler(req) {
      let { id } = yield* useParams<{ id: string }>();

      return yield* softRedirect(
        req,
        yield* createRootUrl(`guides/${series}`)(id),
      );
    },
  };
}
