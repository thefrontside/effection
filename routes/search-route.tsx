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
            <div class="prose m-auto max-w-full">
              <h1>Search</h1>
              <div id="search-page" />
            </div>
            <link href="/pagefind/pagefind-ui.css" rel="stylesheet" />
            <script src="/pagefind/pagefind-ui.js"></script>
            <is-land on:idle on:visible on:save-data="false">
              <script>
                {`
                const pagefindUI = new PagefindUI({ 
                  element: "#search-page", 
                  showSubResults: true, 
                  autofocus: true,
                  showImages: false,
                  pageSize: 10,
                  openFilters: ['Section','Version']
                });

                const urlParams = new URLSearchParams(window.location.search);
                const query = urlParams.get('q');
                if (query) {
                  pagefindUI.triggerSearch(query);
                }
              `}
              </script>
            </is-land>
          </>
        </AppHtml>
      );
    },
  };
}
