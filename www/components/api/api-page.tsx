import { all, type Operation } from "effection";
import type { JSXElement } from "revolution";
import { useConfig } from "../../context/config.ts";
import { LocalDocPage } from "../../hooks/use-deno-doc.tsx";
import { ResolveLinkFunction, useMarkdown } from "../../hooks/use-markdown.tsx";
import { Package, usePackage } from "../../lib/package.ts";
import { gt, major } from "../../lib/semver.ts";
import { createRootUrl, useApiSeries } from "../../lib/links-resolvers.ts";
import { SourceCodeIcon } from "../icons/source-code.tsx";
import { GithubPill } from "../package/source-link.tsx";
import { ExperimentalBadge, Icon } from "../type/icon.tsx";
import { Type } from "../type/jsx.tsx";
import { Keyword } from "../type/tokens.tsx";

/**
 * Root-based URL for a symbol's doc page. Experimental symbols live under a
 * `/experimental` segment, so linking cannot be relative to the current page
 * (which would resolve into or out of the wrong namespace).
 */
function* pageHref(page: LocalDocPage): Operation<string> {
  let series = yield* useApiSeries();
  let base = page.experimental ? `api/${series}/experimental` : `api/${series}`;
  return yield* createRootUrl(base)(page.name);
}

export function* ApiPage({
  pages,
  current,
  pkg,
  banner,
}: {
  current: LocalDocPage;
  pages: LocalDocPage[];
  pkg: Package;
  banner?: JSXElement;
}) {
  const linkResolver: ResolveLinkFunction = function* resolve(
    symbol,
    connector,
    method,
  ) {
    const target = pages &&
      pages.find((page) => page.name === symbol);

    if (target) {
      let href = yield* pageHref(target);
      if (connector && method) {
        href = `${href}#${method}`;
      }
      return `[${[symbol, connector, method].join("")}](${href})`;
    } else {
      return symbol;
    }
  };

  return (
    <>
      {yield* ApiReference({
        pages,
        current,
        pkg,
        content: (
          <>
            <>{banner}</>
            {yield* SymbolHeader({ pkg, page: current })}
            {yield* ApiBody({ page: current, linkResolver })}
          </>
        ),
        versionToggle: yield* (function* () {
          const { series: allSeries } = yield* useConfig();
          const series = yield* useApiSeries();
          const entrypoint = current.experimental ? "./experimental" : ".";
          const suffix = current.experimental ? "/experimental" : "";

          // Toggle across every series that documents the current symbol:
          // stable releases show their version (e.g. 3.6.1, 4.0.3), and the
          // prerelease shows as "next" — but only when it's actually newer
          // than its stable parent (otherwise there's nothing to switch to).
          const links = yield* all(
            allSeries.map(function* (s) {
              const seriesPkg = yield* usePackage({
                type: "worktree",
                series: s.name,
              });

              if (s.includePrerelease) {
                const parent = allSeries.find((p) => p.name === s.parent);
                if (parent) {
                  const parentPkg = yield* usePackage({
                    type: "worktree",
                    series: parent.name,
                  });
                  if (!gt(seriesPkg.version, parentPkg.version)) {
                    return null;
                  }
                }
              }

              const seriesDocs = yield* seriesPkg.docs();
              const hasSymbol = (seriesDocs[entrypoint] ?? []).some((node) =>
                node.name === current.name
              );

              if (!hasSymbol) {
                return null;
              }

              const isCurrent = s.name === series;
              const label = s.includePrerelease ? "next" : seriesPkg.version;

              return (
                <a
                  href={yield* createRootUrl(`api/${s.name}${suffix}`)(
                    current.name,
                  )}
                  class={`text-base ${
                    isCurrent
                      ? "font-bold text-sky-500"
                      : "text-gray-600 dark:text-gray-400 hover:text-sky-500"
                  }`}
                >
                  {label}
                </a>
              );
            }),
          );
          return (
            <span class="flex flex-row space-x-2">
              {...links.filter((link): link is JSXElement => link !== null)}
            </span>
          );
        })(),
      })}
    </>
  );
}

export function* ApiBody({
  page,
  linkResolver,
}: {
  page: LocalDocPage;
  linkResolver: ResolveLinkFunction;
}) {
  const elements: JSXElement[] = [];

  for (const [i, section] of Object.entries(page.sections)) {
    if (section.markdown) {
      elements.push(
        <div class={`${i !== "0" ? "border-t-2" : ""} pb-7`}>
          <div class="flex mt-7 group">
            <h2
              class="my-0! grow"
              id={section.id}
              data-kind={section.declaration.kind}
              data-name={page.name}
            >
              {yield* Type({
                declaration: section.declaration,
                symbol: { name: page.name },
              })}
            </h2>
            <a
              class="opacity-40 before:content-['View_code'] group-hover:opacity-100 before:flex before:text-xs before:mr-1 p-2 flex-none flex rounded no-underline items-center h-8"
              href={`${section.declaration.location.url}`}
            >
              <SourceCodeIcon />
            </a>
          </div>
          <div class="[&>hr]:my-5 [&>p]:mb-0">
            {yield* useMarkdown(section.markdown, {
              linkResolver,
              slugPrefix: section.id,
            })}
          </div>
        </div>,
      );
    }
  }

  return <>{elements}</>;
}

export function* ApiReference({
  pkg,
  content,
  current,
  pages,
  versionToggle,
}: {
  pkg: Package;
  content: JSXElement;
  current: LocalDocPage;
  pages: LocalDocPage[];
  versionToggle: JSXElement;
}) {
  return (
    <section class="min-h-0 mx-auto w-full justify-items-normal md:grid md:grid-cols-[225px_auto] lg:grid-cols-[225px_auto_200px] md:gap-4">
      <aside class="min-h-0 overflow-auto hidden md:block top-[120px] sticky h-fit bg-white dark:bg-gray-900 dark:text-gray-200">
        <nav class="pl-4">
          <h3 class="text-xl flex flex-col mb-3">
            <span class="font-bold">API Reference</span>
            {versionToggle}
          </h3>
          {yield* Menu({ pages, current })}
        </nav>
      </aside>
      <article
        class="prose dark:prose-invert max-w-full px-6"
        data-pagefind-filter={`version[data-series], section:API Reference`}
        data-series={`v${major(pkg.version)}`}
      >
        {content}
      </article>
    </section>
  );
}

export function* SymbolHeader(
  { page, pkg }: { page: LocalDocPage; pkg: Package },
) {
  return (
    <header class="flex flex-row items-center space-x-2">
      <h1 class="mb-0">
        <Keyword>
          {page.kind === "typeAlias" ? "type alias " : page.kind}
        </Keyword>{" "}
        {page.name}
      </h1>
      {yield* GithubPill({
        url: pkg.ref.url,
        text: pkg.ref.nameWithOwner,
        // url: pkg.source.toString(),
        // text: pkg.ref.repository.nameWithOwner,
      })}
    </header>
  );
}

function* Menu({
  pages,
  current,
}: {
  current: LocalDocPage;
  pages: LocalDocPage[];
}) {
  const elements = [];
  for (const page of pages.sort((a, b) => a.name.localeCompare(b.name))) {
    const isCurrent = page.name === current.name &&
      !!page.experimental === !!current.experimental;
    elements.push(
      <li>
        {isCurrent
          ? (
            <span class="rounded px-2 block w-full py-2 bg-gray-100 dark:bg-gray-700 cursor-default ">
              <Icon kind={page.kind} />
              {page.name}
              {page.experimental ? <ExperimentalBadge class="ml-1" /> : ""}
            </span>
          )
          : (
            <a
              class="rounded px-2 block w-full py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              href={yield* pageHref(page)}
            >
              <Icon kind={page.kind} />
              {page.name}
              {page.experimental ? <ExperimentalBadge class="ml-1" /> : ""}
            </a>
          )}
      </li>,
    );
  }
  return <menu>{elements}</menu>;
}
