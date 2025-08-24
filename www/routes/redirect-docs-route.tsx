import { type JSXElement, useParams } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { guides } from "../resources/guides.ts";
import { Repository } from "../resources/repository.ts";
import { getSeriesRef } from "./guides-route.tsx";
import { createRootUrl } from "./links-resolvers.ts";
import { softRedirect } from "./redirect.tsx";

export function redirectDocsRoute({
  repository,
  series,
}: {
  repository: Repository;
  series: string;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      const ref = yield* getSeriesRef({ repository, series });
      const pages = yield* guides({ ref });

      const paths = [];
      for (let page of yield* pages.all()) {
        paths.push({
          pathname: pathname({ id: page.id, series }),
        });
      }

      return paths;
    },
    *handler(req) {
      const { id } = yield* useParams<{ id: string }>();

      return yield* softRedirect(
        req,
        yield* createRootUrl(`guides/${series}`)(id),
      );
    },
  };
}
