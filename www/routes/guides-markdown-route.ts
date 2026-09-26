import { all, type Operation } from "effection";
import { useParams } from "revolution";

import { useConfig } from "../context/config.ts";
import { useGuides } from "../resources/guides.ts";
import { markdown, notFound } from "../lib/markdown-response.ts";
import type { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";

/**
 * Serve the markdown source of a guide.
 *
 * `llms.txt` sends agents to the guides, and an agent wants what the guide is
 * written in rather than the page it is rendered into. Serving the source from
 * the site keeps a dev server or a preview from sending them to GitHub for a
 * copy of the docs that belongs to a different version of the site.
 */
export function guidesMarkdownRoute(): SitemapRoute<Response> {
  return {
    *routemap(generate): Operation<RoutePath[]> {
      let { series } = yield* useConfig();
      // guides only exist for stable series, the same ones the pages cover
      let stable = series.filter((s) => !s.includePrerelease);

      let paths = stable.map(function* (s) {
        let pages = yield* useGuides(s.name);

        return (yield* pages.all()).map((page) => ({
          pathname: generate({ id: page.id, series: s.name }),
        }));
      });

      return (yield* all(paths)).flat();
    },
    *handler(): Operation<Response> {
      let { series: allSeries, current } = yield* useConfig();
      let stable = allSeries.filter((s) => !s.includePrerelease);

      let { id, series = current } = yield* useParams<{
        id: string;
        series: string | undefined;
      }>();

      if (!stable.some((s) => s.name === series)) {
        return notFound(`there are no guides for '${series}'`);
      }

      let pages = yield* useGuides(series);
      let page = yield* pages.get(id);

      if (!page) {
        return notFound(`there is no guide called '${id}' in ${series}`);
      }

      return markdown(page.markdown);
    },
  };
}
