import { all } from "effection";
import type { JSXElement } from "revolution";
import { useConfig } from "../../context/config.ts";
import { LocalDocPage } from "../../hooks/use-deno-doc.tsx";
import { ResolveLinkFunction, useMarkdown } from "../../hooks/use-markdown.tsx";
import { Package, usePackage } from "../../lib/package.ts";
import { major } from "../../lib/semver.ts";
import { createRootUrl, createSibling } from "../../lib/links-resolvers.ts";
import { SourceCodeIcon } from "../icons/source-code.tsx";
import { GithubPill } from "../package/source-link.tsx";
import { Icon } from "../type/icon.tsx";
import { Type } from "../type/jsx.tsx";
import { Keyword } from "../type/tokens.tsx";

export function* ApiPage({
  pages,
  current,
  pkg,
  externalLinkResolver,
  banner,
}: {
  current: string;
  pages: LocalDocPage[];
  pkg: Package;
  banner?: JSXElement;
  externalLinkResolver: ResolveLinkFunction;
}) {
  const page = pages.find((node) => node.name === current);

  if (!page) throw new Error(`Could not find a doc page for ${current}`);

  const linkResolver: ResolveLinkFunction = function* resolve(
    symbol,
    connector,
    method,
  ) {
    const target = pages &&
      pages.find((page) => page.name === symbol && page.kind !== "import");

    if (target) {
      return `[${
        [symbol, connector, method].join(
          "",
        )
      }](${yield* externalLinkResolver(symbol, connector, method)})`;
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
            {yield* SymbolHeader({ pkg, page })}
            {yield* ApiBody({ page, linkResolver })}
          </>
        ),
        linkResolver: createSibling,
        versionToggle: yield* (function* () {
          const { series } = yield* useConfig();
          // Only show stable series in version toggle (no prereleases)
          const stableSeries = series.filter((s) => !s.includePrerelease);
          const currentSeries = `v${major(pkg.version)}`;

          const links = yield* all(
            stableSeries.map(function* (s) {
              const seriesPkg = yield* usePackage({
                type: "worktree",
                series: s.name,
              });
              const seriesDocs = yield* seriesPkg.docs();
              const hasSymbol = seriesDocs["."].some((node) =>
                node.name === current
              );

              if (!hasSymbol) return null;

              return (
                <a
                  href={yield* createRootUrl(`api/${s.name}`)(current)}
                  class={`text-base ${
                    s.name === currentSeries
                      ? "font-bold text-sky-500"
                      : "text-gray-600 dark:text-gray-400 hover:text-sky-500"
                  }`}
                >
                  {seriesPkg.version}
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
              data-kind={section.node.kind}
              data-name={section.node.name}
            >
              {yield* Type({ node: section.node })}
            </h2>
            <a
              class="opacity-40 before:content-['View_code'] group-hover:opacity-100 before:flex before:text-xs before:mr-1 p-2 flex-none flex rounded no-underline items-center h-8"
              href={`${section.node.location.url}`}
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
  linkResolver,
  versionToggle,
}: {
  pkg: Package;
  content: JSXElement;
  current: string;
  pages: LocalDocPage[];
  linkResolver: ResolveLinkFunction;
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
          {yield* Menu({ pages, current, linkResolver })}
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
  linkResolver,
}: {
  current: string;
  pages: LocalDocPage[];
  linkResolver: ResolveLinkFunction;
}) {
  const elements = [];
  for (const page of pages.sort((a, b) => a.name.localeCompare(b.name))) {
    elements.push(
      <li>
        {current === page.name
          ? (
            <span class="rounded px-2 block w-full py-2 bg-gray-100 dark:bg-gray-700 cursor-default ">
              <Icon kind={page.kind} />
              {page.name}
            </span>
          )
          : (
            <a
              class="rounded px-2 block w-full py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              href={yield* linkResolver(page.name)}
            >
              <Icon kind={page.kind} />
              {page.name}
            </a>
          )}
      </li>,
    );
  }
  return <menu>{elements}</menu>;
}
