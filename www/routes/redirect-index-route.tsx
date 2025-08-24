import { type Operation } from "effection";
import { type JSXElement } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { softRedirect } from "./redirect.tsx";

export function redirectIndexRoute(
  redirect: () => Operation<string>,
): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      return [
        {
          pathname: pathname(),
        },
      ];
    },
    *handler(req) {
      return yield* softRedirect(req, yield* redirect());
    },
  };
}
