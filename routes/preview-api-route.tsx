import { useParams, type JSXElement } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { useAppHtml } from "./app.html.tsx";
import { Repository } from "../resources/repository.ts";
import { ApiPage } from "./api-reference-route.tsx";
import { createSibling } from "./links-resolvers.ts";
import { Alert } from "../components/alert.tsx";

export function previewApiRoute({
  library,
}: {
  library: Repository;
}): SitemapRoute<JSXElement> {
  return {
    handler: function* (request) {
      let { symbol } = yield* useParams<{ symbol: string }>();

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

        const linkResolver = function* (symbol: string) {
          return `[${symbol}](${yield* createSibling(symbol)})`;
        };

        const AppHtml = yield* useAppHtml({
          title: `${branch} | API Reference | Effection`,
          description: `API Reference for Effection on branch ${branch}`,
        });

        return (
          <AppHtml>
            <>
              <Alert level="info" title={`Preview for ${branch}`}>
                <p>
                  You’re viewing the API reference for branch {branch}. This is
                  a preview URL used for Effection development.
                </p>
              </Alert>
              {
                yield* ApiPage({
                  pages,
                  current: symbol,
                  ref,
                  externalLinkResolver: linkResolver,
                })
              }
            </>
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
