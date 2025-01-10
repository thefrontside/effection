import { type JSXElement } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { useAppHtml } from "./app.html.tsx";
import { Repository } from "../resources/repository.ts";
import { Alert, listPages } from "./api-minor-index-route.tsx";
import { DocPage } from "../hooks/use-deno-doc.tsx";
import { createChildURL } from "./links-resolvers.ts";

export function previewRoute({
  library,
}: {
  library: Repository;
}): SitemapRoute<JSXElement> {
  return {
    handler: function* (request) {
      const { searchParams } = new URL(request.url);

      const branch = searchParams.get("branch");

      try {
        if (!branch)
          throw new Error(
            `Missing branch query parameter. Try specifying it with ${request.url}?branch=<branch>.`,
          );

        const ref = yield* library.loadRef(`heads/${branch}`);

        const pkg = yield* ref.loadRootPackage();

        if (!pkg)
          throw new Error(`Failed to load root package for ${branch} branch`);

        const pages = (yield* pkg.docs())["."];

        const AppHtml = yield* useAppHtml({
          title: `${branch} | API Reference | Effection`,
          description: `API Reference for Effection on branch ${branch}`,
        });

        return (
          <AppHtml>
            <article class="prose m-auto">
              <Alert level="info" title={`Preview for ${branch}`}>
                <p>
                  You’re viewing the API reference for branch {branch}. This is
                  a preview URL used for Effection development.
                </p>
              </Alert>
              <section>
                <h2>API Reference</h2>
                <p>This release includes the following exports:</p>
                <ul class="columns-3">
                  {
                    yield* listPages({
                      pages,
                      linkResolver: createChildURL("api"),
                    })
                  }
                </ul>
              </section>
            </article>
          </AppHtml>
        );
      } catch (e) {
        console.error(e);
        const AppHTML = yield* useAppHtml({
          title: "Preview failed to load",
          description: "Preview failed to load",
        });
        return (
          <AppHTML>
            <Alert level="error" title="Preview failed to load">
              <>{`${e}`}</>
            </Alert>
          </AppHTML>
        );
      }
    },
  };
}
