import { type JSXElement } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { softRedirect } from "./redirect.tsx";
import { Operation } from "effection";

export function redirectRoute({
  redirect,
}: {
  redirect: () => Operation<string>;
}): SitemapRoute<JSXElement> {
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
