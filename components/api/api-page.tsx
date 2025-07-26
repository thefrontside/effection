import type { JSXElement } from "revolution";
import { DocPage } from "../../hooks/use-deno-doc.tsx";
import { ResolveLinkFunction, useMarkdown } from "../../hooks/use-markdown.tsx";
import { RepositoryRef } from "../../resources/repository-ref.ts";
import { createSibling } from "../../routes/links-resolvers.ts";
import { Type } from "../type/jsx.tsx";
import { extractVersion, major } from "../../lib/semver.ts";
import { IconExternal } from "../icons/external.tsx";
import { Keyword } from "../type/tokens.tsx";
import { GithubPill } from "../package/source-link.tsx";
import { Package } from "../../resources/package.ts";
import { Icon } from "../type/icon.tsx";
import { SourceCodeIcon } from "../icons/source-code.tsx";

export function* ApiPage({
  pages,
  current,
  ref,
  externalLinkResolver,
  banner,
}: {
  current: string;
  pages: DocPage[];
  ref: RepositoryRef;
  banner?: JSXElement;
  externalLinkResolver: ResolveLinkFunction;
}) {
  const pkg = yield* ref.loadRootPackage();
  if (!pkg) throw new Error(`Fail to retrieve root package for ${ref.name}`);

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
        ref,
        content: (
          <>
            <>{banner}</>
            {yield* SymbolHeader({ pkg, page })}
            {yield* ApiBody({ page, linkResolver })}
          </>
        ),
        linkResolver: createSibling,
      })}
    </>
  );
}

export function* ApiBody({
  page,
  linkResolver,
}: {
  page: DocPage;
  linkResolver: ResolveLinkFunction;
}) {
  const elements: JSXElement[] = [];

  for (const [i, section] of Object.entries(page.sections)) {
    if (section.markdown) {
      elements.push(
        <div class={`${i !== "0" ? "border-t-2" : ""} pb-7`}>
          <div class="flex mt-7 group">
            <h2
              class="my-0 grow"
              id={section.id}
              data-kind={section.node.kind}
              data-name={section.node.name}
            >
              {yield* Type({ node: section.node })}
            </h2>
            <a
              class="opacity-0 before:content-['View_code'] group-hover:opacity-100 before:flex before:text-xs before:mr-1 hover:bg-gray-100 p-2 flex-none flex rounded no-underline items-center h-8"
              href={`${section.node.location.filename}#L${section.node.location.line}`}
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
  ref,
  content,
  current,
  pages,
  linkResolver,
}: {
  ref: RepositoryRef;
  content: JSXElement;
  current: string;
  pages: DocPage[];
  linkResolver: ResolveLinkFunction;
}) {
  const version = extractVersion(ref.name) === "0.0.0"
    ? ref.name
    : extractVersion(ref.name);

  return (
    <section class="min-h-0 mx-auto w-full justify-items-normal md:grid md:grid-cols-[225px_auto] lg:grid-cols-[225px_auto_200px] md:gap-4">
      <aside class="min-h-0 overflow-auto hidden md:block top-[120px] sticky h-fit bg-white dark:bg-gray-900 dark:text-gray-200">
        <nav class="pl-4">
          <h3 class="text-xl flex flex-col mb-3">
            <span class="font-bold">API Reference</span>
            <span>
              <a href={ref.getUrl().toString()} class="font-semibold text-base">
                {version}{" "}
                <IconExternal
                  class="inline-block align-baseline"
                  height="15"
                  width="15"
                />
              </a>
            </span>
          </h3>
          {yield* Menu({ pages, current, linkResolver })}
        </nav>
      </aside>
      <article
        class="prose max-w-full px-6"
        data-pagefind-filter={`version[data-series], section:API Reference`}
        data-series={`v${major(version)}`}
      >
        {content}
      </article>
    </section>
  );
}

export function* SymbolHeader({ page, pkg }: { page: DocPage; pkg: Package }) {
  return (
    <header class="flex flex-row items-center space-x-2">
      <h1 class="mb-0">
        <Keyword>
          {page.kind === "typeAlias" ? "type alias " : page.kind}
        </Keyword>{" "}
        {page.name}
      </h1>
      {yield* GithubPill({
        url: pkg.source.toString(),
        text: pkg.ref.repository.nameWithOwner,
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
  pages: DocPage[];
  linkResolver: ResolveLinkFunction;
}) {
  const elements = [];
  for (const page of pages.sort((a, b) => a.name.localeCompare(b.name))) {
    elements.push(
      <li>
        {current === page.name
          ? (
            <span class="rounded px-2 block w-full py-2 bg-gray-100 cursor-default ">
              <Icon kind={page.kind} />
              {page.name}
            </span>
          )
          : (
            <a
              class="rounded px-2 block w-full py-2 hover:bg-gray-100"
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
