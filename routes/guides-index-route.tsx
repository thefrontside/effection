import { all, Operation } from "effection";
import { type JSXElement, respondNotFound, useParams } from "revolution";

import { useDescription } from "../hooks/use-description-parse.tsx";
import { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";
import { guides, type GuidesMeta } from "../resources/guides.ts";
import { useAppHtml } from "./app.html.tsx";
import { createChildURL, createSibling } from "./links-resolvers.ts";
import { Navburger } from "../components/navburger.tsx";
import { Repository } from "../resources/repository.ts";
import { softRedirect } from "./redirect.tsx";
import { IconExternal } from "../components/icons/external.tsx";

function* getSeriesRef({
  repository,
  series,
}: {
  repository: Repository;
  series: string;
}) {
  const latest = yield* repository.getLatestSemverTag(`effection-${series}`);

  if (!latest) {
    throw new Error(`Could not retrieve latest tag for "effection-${series}"`);
  }

  return yield* repository.loadRef(`tags/${latest.name}`);
}

const SERIES = ["v3", "v4"];

export function guidesIndexRoute({
  repository,
}: {
  repository: Repository;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      const paths = [];
      for (let series of SERIES) {
        paths.push({
          pathname: pathname({ series }),
        });
      }
      return paths;
    },
    *handler(req) {
      let { series } = yield* useParams<{
        series: string;
      }>();

      const ref = yield* getSeriesRef({ repository, series });
      const pages = yield* guides({ ref });

      const page = yield* pages.first();

      return yield* softRedirect(
        req,
        yield* createChildURL()(page.id),
      );
    }
  }
}