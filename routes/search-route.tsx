import type { JSXElement } from "revolution";

import { useAppHtml } from "./app.html.tsx";
import { SitemapRoute } from "../plugins/sitemap.ts";

export function searchRoute(): SitemapRoute<JSXElement> {
  return {
    *routemap(generate) {
      return [
        {
          pathname: generate(),
        },
      ];
    },
    handler: function* () {
      let AppHtml = yield* useAppHtml({
        title: `Search`,
        description: "Search Effection resources and documentation",
      });

      return (
        <AppHtml>
          <>
            <div id="search" />
            <link href="/pagefind/pagefind-ui.css" rel="stylesheet" />
            <script src="/pagefind/pagefind-ui.js"></script>
            <script>
              {`
              window.addEventListener('DOMContentLoaded', (event) => {
                new PagefindUI({ 
                  element: "#search", 
                  showSubResults: true, 
                  autofocus: true
                });
              });
              `}
            </script>
          </>
        </AppHtml>
      );
    },
  };
}
