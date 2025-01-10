import { type JSXElement, useParams } from "revolution";

import { Type } from "../components/type/jsx.tsx";
import {
  defaultLinkResolver,
  ResolveLinkFunction,
  useMarkdown,
} from "../hooks/use-markdown.tsx";
import { SitemapRoute } from "../plugins/sitemap.ts";
import { Repository } from "../resources/repository.ts";
import { useAppHtml } from "./app.html.tsx";
import { fetchMinorVersions } from "./api-index-route.tsx";
import { all, Operation } from "effection";
import { DocsPages, isDocsPages } from "../hooks/use-deno-doc.tsx";
import { ApiPage } from "./api-reference-route.tsx";
import { compare, extractVersion } from "../lib/semver.ts";
import { Alert } from "../components/alert.tsx";
import { createSibling } from "./links-resolvers.ts";

export function apiMinorSymbolRoute({
  library,
}: {
  library: Repository;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(generate) {
      // skip the first version because it's covered by /api/v3 route
      const [, ...versions] = yield* fetchMinorVersions({
        repository: library,
        pattern: "effection-v3",
      });

      const fetched = yield* all(
        versions.map(function* ([series, version]): Operation<
          [string, string, DocsPages | Error]
        > {
          try {
            const ref = yield* library.loadRef(`tags/effection-v${version}`);
            const pkg = yield* ref.loadRootPackage();
            if (pkg) {
              return [series, version, yield* pkg?.docs()];
            } else {
              return [
                series,
                version,
                new Error(`Could not fetch pkg in root of ${version}`),
              ];
            }
          } catch (e) {
            return [series, version, e as Error];
          }
        }),
      );

      return fetched.flatMap(([minor, _version, docs]) => {
        if (isDocsPages(docs)) {
          return docs["."].map((page) => ({
            pathname: generate({
              minor,
              symbol: page.name,
            }),
          }));
        }
        return [];
      });
    },
    handler: function* () {
      let { symbol, minor } = yield* useParams<{
        minor: string;
        symbol: string;
      }>();

      try {
        const latest = yield* library.getLatestSemverTag("effection-v3");

        if (!latest)
          throw new Error(
            `Failed to retrieve latest version for "effection-v3" tag`,
          );

        const tag = yield* library.getLatestSemverTag(minor);
        if (!tag)
          throw new Error(`Failed to retrieve latest version for ${minor}`);

        const ref = yield* library.loadRef(`tags/${tag?.name}`);
        const pkg = yield* ref.loadRootPackage();

        if (!pkg) throw new Error(`Failed to load root package for ${minor}`);

        const pages = (yield* pkg.docs())["."];

        const page = pages.find((node) => node.name === symbol);

        if (!page) throw new Error(`Could not find a doc page for ${symbol}`);

        const internal: ResolveLinkFunction = function* resolve(
          symbol,
          connector,
          method,
        ) {
          if (pages && pages.find((page) => page.name === symbol)) {
            return yield* defaultLinkResolver(symbol, connector, method);
          } else {
            return symbol;
          }
        };

        const elements: JSXElement[] = [];
        if (page) {
          for (const [i, section] of Object.entries(page?.sections)) {
            if (section.markdown) {
              elements.push(
                <section
                  id={section.id}
                  class={`${i !== "0" ? "border-t-2" : ""} pb-7`}
                >
                  <h2 class="flex mt-7">
                    {yield* Type({ node: section.node })}
                  </h2>
                  <div class="[&>hr]:my-5 [&>p]:mb-0">
                    {
                      yield* useMarkdown(section.markdown, {
                        linkResolver: internal,
                        slugPrefix: `-${section.id}`,
                      })
                    }
                  </div>
                </section>,
              );
            }
          }
        }

        const latestVersion = extractVersion(latest.name);
        const version = extractVersion(tag.name);
        const outdated = compare(version, latestVersion) < 0;

        const AppHtml = yield* useAppHtml({
          title: `${symbol} | ${version} | API Reference | Effection`,
          description: page.description,
        });

        return (
          <AppHtml>
            <>
              {
                yield* ApiPage({
                  pages,
                  current: symbol,
                  ref,
                  externalLinkResolver: function* (symbol) {
                    return yield* createSibling(symbol);
                  },
                  banner: outdated ? (
                    <Alert level="info" class="mb-6">
                      <p>
                        Version {version} is behind the current release:{" "}
                        <a
                          class="underline font-bold"
                          href={`/api/v3/${page.name}`}
                        >
                          jump to latest version
                        </a>{" "}
                        ({latestVersion}).
                      </p>
                    </Alert>
                  ) : (
                    <></>
                  ),
                })
              }
            </>
          </AppHtml>
        );
      } catch (e) {
        console.error(e);
        const AppHTML = yield* useAppHtml({
          title: `${symbol} not found`,
          description: `Failed to load ${symbol} due to error.`,
        });
        return (
          <AppHTML>
            <p>Failed to load {symbol} due to error.</p>
          </AppHTML>
        );
      }
    },
  };
}
