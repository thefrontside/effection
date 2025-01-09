import { JSXChild, useParams, type JSXElement } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { useAppHtml } from "./app.html.tsx";
import { Repository } from "../resources/repository.ts";
import { DocPage, DocPageLinkResolver } from "../hooks/use-deno-doc.tsx";
import { createAPIReferenceLinkResolver } from "./links-resolvers.ts";
import { compare, extractVersion } from "../lib/semver.ts";
import { fetchMinorVersions } from "./api-index-route.tsx";
import { InfoIcon } from "../components/icons/info.tsx";

export function apiMinorIndexRoute({
  library,
}: {
  library: Repository;
}): SitemapRoute<JSXElement> {
  return {
    *routemap(generate) {
      // skip the first version because it's covered by /api/v3 route
      const [, ...minors] = yield* fetchMinorVersions({
        repository: library,
        pattern: "effection-v3",
      });

      return minors.map(([minor]) => ({
        pathname: generate({
          minor,
        }),
      }));
    },
    handler: function* () {
      let { minor } = yield* useParams<{ minor: string }>();

      try {
        const latest = yield* library.getLatestSemverTag("effection-v3");

        if (!latest)
          throw new Error(
            `Failed to retrieve latest version for "effection-v3" tag`,
          );

        const tag = yield* library.getLatestSemverTag(minor);

        if (!tag) throw new Error(`Failed to retrieve latest tag for ${minor}`);

        const ref = yield* library.loadRef(`tags/${tag.name}`);
        const pkg = yield* ref.loadRootPackage();

        if (!pkg) throw new Error(`Failed to load root package for ${minor}`);

        const pages = (yield* pkg.docs())["."];

        const version = extractVersion(tag.name);
        const latestVersion = extractVersion(latest.name);

        const linkResolver = createAPIReferenceLinkResolver(version);

        const AppHtml = yield* useAppHtml({
          title: `API Reference | Effection`,
          description: `API Reference for Effection`,
        });

        const outdated = compare(version, latestVersion) < 0;

        return (
          <AppHtml>
            <article class="prose m-auto">
              {outdated ? (
                <Alert
                  title="Newer version available"
                  level="info"
                  class="mb-6"
                >
                  <>
                    <p>
                      You’re viewing the API reference for version {version},
                      but the latest version is {latestVersion}. The latest
                      version include may important updates and fixes.
                    </p>
                    <a href={`/api/v3`}>View Latest Version</a>
                  </>
                </Alert>
              ) : (
                <></>
              )}
              <h1>{version}</h1>
              <section>
                <h2>API Reference</h2>
                <p>This release includes the following exports:</p>
                <ul class="columns-3">
                  {
                    yield* listPages({
                      pages,
                      linkResolver,
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

const ALERT_LEVELS = {
  warning: "bg-orange-100 border-orange-500 text-orange-700",
  error: "bg-red-100 border-red-400 text-red-700",
  info: "bg-blue-100 border-blue-500 text-blue-700",
} as const;

export function Alert({
  title,
  children,
  class: className,
  level,
}: {
  title: string;
  level: "info" | "warning" | "error";
  children: JSXChild;
  class?: string;
}) {
  return (
    <div
      class={`${className ?? ""} ${ALERT_LEVELS[level]} border-l-4 p-4 [&>p]:my-1`}
      role="alert"
    >
      <p class="font-bold">{title}</p>
      {children}
    </div>
  );
}
