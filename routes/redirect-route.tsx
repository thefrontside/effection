import type { JSXElement } from "revolution";
import { SitemapRoute } from "../plugins/sitemap.ts";
import { useAppHtml } from "./app.html.tsx";

export function redirectRoute({
  to,
}: {
  to: string;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(generate) {
      return [
        {
          pathname: generate(),
        },
      ];
    },
    handler: function* (req) {
      const url = new URL(to, new URL(req.url).origin);

      let AppHtml = yield* useAppHtml({
        title: `Redirect to ${to} | Effection`,
        description: `Redirect ${to}`,
        hasLeftSidebar: true,
        head: <meta http-equiv="refresh" content={`0; url=${url}`} />,
      });

      return (
        <AppHtml search={false}>
          <p>
            <a href={to}>Redirecting to ${to}</a>
          </p>
        </AppHtml>
      );
    },
  };
}
