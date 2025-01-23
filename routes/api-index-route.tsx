import { all, Operation } from "effection";
import { type JSXElement, respondNotFound } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { useAppHtml } from "./app.html.tsx";
import { getApiForLatestTag } from "./api-reference-route.tsx";
import { Repository } from "../resources/repository.ts";
import { DocPage } from "../hooks/use-deno-doc.tsx";
import { createChildURL } from "./links-resolvers.ts";
import { extractVersion, major, minor, rsort } from "../lib/semver.ts";
import { ResolveLinkFunction } from "../hooks/use-markdown.tsx";
import { Icon } from "../components/type/icon.tsx";

export function apiIndexRoute({
  library,
  search,
}: {
  library: Repository;
  search: boolean;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(gen) {
      return [{ pathname: gen() }];
    },
    handler: function* () {
      const [[v3ref, v3docs], [v4ref, v4docs]] = yield* all([
        getApiForLatestTag(library, "effection-v3"),
        getApiForLatestTag(library, "effection-v4"),
      ]);

      if (!v3ref) {
        console.error(new Error(`Could not retrieve a tag for "effection-v3"`));
        return yield* respondNotFound();
      }

      if (!v3docs) {
        console.error(new Error(`Cound not retrieve docs for "effection-v3"`));
        return yield* respondNotFound();
      }

      const v3pkg = yield* v3ref.loadRootPackage();

      if (!v3pkg) {
        console.error(
          new Error(`Could not retrieve root package from ${v3ref.ref}`),
        );
        return yield* respondNotFound();
      }

      const v3version = extractVersion(v3ref.name);

      if (!v4ref) {
        console.error(new Error(`Could not retrieve a tag for "effection-v4"`));
        return yield* respondNotFound();
      }

      if (!v4docs) {
        console.error(new Error(`Cound not retrieve docs for "effection-v4"`));
        return yield* respondNotFound();
      }

      const v4pkg = yield* v3ref.loadRootPackage();

      if (!v4pkg) {
        console.error(
          new Error(`Could not retrieve root package from ${v4ref.ref}`),
        );
        return yield* respondNotFound();
      }

      const v4version = extractVersion(v4ref.name);

      const AppHtml = yield* useAppHtml({
        title: `API Reference | Effection`,
        description: `API Reference for Effection`,
      });

      return (
        <AppHtml search={search}>
          <article class="prose m-auto">
            <h1>API Reference</h1>
            <section>
              <h2>Stable</h2>
              <p>
                The stable releases are recommended for most Effection users.
              </p>
              <h3>Latest release: {v3version}</h3>
              <p>This release includes the following exports:</p>
              <ul class="columns-3 pl-0">
                {yield* listPages({
                  pages: v3docs["."],
                  linkResolver: createChildURL("v3"),
                })}
              </ul>
              <h3>Previous releases</h3>
              <ul>
                {(yield* fetchMinorVersions({
                  repository: library,
                  pattern: "effection-v3",
                }))
                  .filter(([_series, version]) => version !== v3version)
                  .map(([series, _version]) => (
                    <li class="inline-block pr-10">
                      <a href={`/api/${series}/`}>{series}</a>
                    </li>
                  ))}
              </ul>
            </section>
            <hr />
            <section>
              <h2>Canary</h2>
              <p>
                Canary releases are experimental and not recommended for most
                new users. Reach out in Discord if you're unsure which version
                is right for you.
              </p>
              <h3>Latest release: {v4version}</h3>
              <p>This release includes the following exports:</p>
              <ul class="columns-3 pl-0">
                {yield* listPages({
                  pages: v3docs["."],
                  linkResolver: createChildURL("v4"),
                })}
              </ul>
            </section>
          </article>
        </AppHtml>
      );
    },
  };
}

function* listPages({
  pages,
  linkResolver,
}: {
  pages: DocPage[];
  linkResolver: ResolveLinkFunction;
}) {
  const elements = [];

  for (const page of pages.sort((a, b) => a.name.localeCompare(b.name))) {
    const link = yield* linkResolver(page.name);
    elements.push(
      <li class="list-none pb-1">
        <a href={link}>
          <Icon kind={page.kind} class="mr-2" />
          {page.name}
        </a>
      </li>,
    );
  }
  return <>{elements}</>;
}

export function* fetchMinorVersions({
  repository,
  pattern,
}: {
  repository: Repository;
  pattern: string;
}): Operation<[string, string][]> {
  const tags = yield* repository.tags(pattern);
  const sorted = rsort(tags.map((tag) => tag.name).map(extractVersion)).reduce<
    Map<string, string>
  >((acc, version) => {
    const series = `${major(version)}.${minor(version)}`;
    if (!acc.has(series)) {
      acc.set(series, version);
    }
    return acc;
  }, new Map());

  return [...sorted.entries()];
}
