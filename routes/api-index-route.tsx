import { all } from "effection";
import { type JSXElement } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { useAppHtml } from "./app.html.tsx";
import { ApiReference, getApiForLatestTag } from "./api-reference-route.tsx";
import { extractVersion, Repository } from "../resources/repository.ts";
import { DocPage, DocPageLinkResolver } from "../hooks/use-deno-doc.tsx";
import { v3Links, v4Links } from "./links-resolvers.ts";

export function apiIndexRoute({
  library,
}: {
  library: Repository;
}): SitemapRoute<JSXElement> {
  return {
    handler: function* () {
      try {
        const [[v3ref, v3docs], [v4ref, v4docs]] = yield* all([
          getApiForLatestTag(library, "effection-v3"),
          getApiForLatestTag(library, "effection-v4"),
        ]);

        if (!v3ref)
          throw new Error(`Could not retrieve a tag for "effection-v3"`);
        if (!v3docs)
          throw new Error(`Cound not retrieve docs for "effection-v3"`);

        const v3pkg = yield* v3ref.loadRootPackage();

        if (!v3pkg)
          throw new Error(`Could not retrieve root package from ${v3ref.ref}`);

        const v3version = extractVersion(v3ref.name);

        if (!v4ref)
          throw new Error(`Could not retrieve a tag for "effection-v4"`);
        if (!v4docs)
          throw new Error(`Cound not retrieve docs for "effection-v4"`);

        const v4pkg = yield* v3ref.loadRootPackage();

        if (!v4pkg)
          throw new Error(`Could not retrieve root package from ${v4ref.ref}`);

        const v4version = extractVersion(v4ref.name);

        const AppHtml = yield* useAppHtml({
          title: `API Reference | Effection`,
          description: `API Reference for Effection`,
        });

        return (
          <AppHtml>
            <>
              {
                yield* ApiReference({
                  pages: v3docs["."],
                  current: "",
                  ref: v3ref,
                  linkResolver: v3Links,
                  content: (
                    <>
                      <h1>API Reference</h1>
                      <section>
                        <h2>Latest release: {v3version}</h2>
                        <ul class="columns-3">
                          {
                            yield* listPages({
                              pages: v3docs["."],
                              linkResolver: v3Links,
                            })
                          }
                        </ul>
                      </section>
                      <section>
                        <h2>Canary release: {v4version}</h2>
                        <ul class="columns-3">
                          {
                            yield* listPages({
                              pages: v3docs["."],
                              linkResolver: v4Links,
                            })
                          }
                        </ul>
                      </section>
                    </>
                  ),
                })
              }
            </>
          </AppHtml>
        );
      } catch (e) {
        console.error(e);
        const AppHTML = yield* useAppHtml({
          title: `Encountered an error fetching API reference.`,
          description: `Encountered an error fetching API reference.`,
        });
        return (
          <AppHTML>
            <p>Failed to load due to an error.</p>
          </AppHTML>
        );
      }
    },
  };
}

function* listPages({
  pages,
  linkResolver,
}: {
  pages: DocPage[];
  linkResolver: DocPageLinkResolver;
}) {
  const elements = [];

  for (const page of pages.sort((a, b) => a.name.localeCompare(b.name))) {
    const link = yield* linkResolver(page);
    elements.push(
      <li>
        <a href={link}>{page.name}</a>
      </li>,
    );
  }
  return <>{elements}</>;
}
