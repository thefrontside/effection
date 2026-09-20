import { type Operation } from "effection";
import { useParams } from "revolution";
import { toText } from "hast-util-to-text";
import type { Nodes } from "hast";

import { Type } from "../components/type/jsx.tsx";
import { useConfig } from "../context/config.ts";
import type { DocPage, LocalDocPage } from "../hooks/use-deno-doc.tsx";
import { createJsDocSanitizer } from "../hooks/use-markdown.tsx";
import {
  apiIndexMarkdown,
  type ApiSection,
  apiSymbolMarkdown,
  apiSymbolPath,
  type ApiVersion,
} from "../lib/api-markdown.ts";
import { markdown, notFound } from "../lib/markdown-response.ts";
import { usePackage } from "../lib/package.ts";
import { useSiteUrl } from "../plugins/current-request.ts";
import type { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";

/**
 * Markdown index of the API reference.
 *
 * Lists what the HTML index at `/api` lists — every stable series, newest
 * first, with its symbols — and links to each symbol's markdown page rather
 * than its page. `llms.txt` points here, so that the catalog of symbols lives
 * in one place instead of being copied into it.
 */
export function apiIndexMarkdownRoute(): SitemapRoute<Response> {
  return {
    *routemap(generate) {
      return [{ pathname: generate() }];
    },
    *handler(): Operation<Response> {
      let url = yield* useSiteUrl();

      return markdown(apiIndexMarkdown(yield* apiVersions(), url));
    },
  };
}

/**
 * Markdown page for one API symbol, from the same `pkg.docs()` the HTML page
 * renders: the declaration as the page shows it, the symbol's documentation,
 * and where the code lives.
 */
export function apiSymbolMarkdownRoute(
  series: string,
  { entrypoint = "." }: { entrypoint?: string } = {},
): SitemapRoute<Response> {
  return {
    *routemap(generate): Operation<RoutePath[]> {
      let pages = yield* symbolPages(series, entrypoint);

      return pages.map((page) => ({
        pathname: generate({ symbol: page.name }),
      }));
    },
    *handler(): Operation<Response> {
      let { symbol } = yield* useParams<{ symbol: string }>();

      let pages = yield* symbolPages(series, entrypoint);
      let page = pages.find((candidate) => candidate.name === symbol);

      if (!page) {
        return notFound(`there is no ${series} api symbol called '${symbol}'`);
      }

      let url = yield* useSiteUrl();
      let sanitize = createJsDocSanitizer(function* (name, connector, method) {
        let target = pages.find((candidate) => candidate.name === name);

        if (!target) {
          return [name, connector, method].filter(Boolean).join("");
        }

        let href = url(apiSymbolPath(series, target));

        return `[${
          [name, connector, method].filter(Boolean).join("")
        }](${href})`;
      });

      let sections: ApiSection[] = [];

      for (let section of page.sections) {
        if (!section.markdown) {
          continue;
        }

        sections.push({
          signature: toText(
            (yield* Type({
              declaration: section.declaration,
              symbol: { name: page.name },
            })) as Nodes,
          ),
          markdown: yield* sanitize(section.markdown),
          source: section.declaration.location?.url?.toString(),
        });
      }

      return markdown(apiSymbolMarkdown(page.name, sections));
    },
  };
}

/**
 * Every stable series, newest first, the way the HTML index orders them.
 */
function* apiVersions(): Operation<ApiVersion[]> {
  let { series } = yield* useConfig();
  let versions: ApiVersion[] = [];

  for (let entry of series.filter((s) => !s.includePrerelease).reverse()) {
    let pkg = yield* usePackage({ type: "worktree", series: entry.name });
    let docs = yield* pkg.docs();

    versions.push({
      series: entry.name,
      version: pkg.version,
      symbols: [
        ...(docs["."] ?? []).map(symbolOf),
        ...(docs["./experimental"] ?? []).map(symbolOf),
      ],
    });
  }

  return versions;
}

function symbolOf(page: DocPage) {
  return { name: page.name, experimental: page.experimental };
}

function* symbolPages(
  series: string,
  entrypoint: string,
): Operation<LocalDocPage[]> {
  let pkg = yield* usePackage({ type: "worktree", series });
  let docs = yield* pkg.docs();

  return docs[entrypoint] ?? [];
}
