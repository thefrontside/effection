import type { Operation } from "effection";
import { aggregateGroups } from "jsr:@std/collections@1.0.9";
import { type JSXElement, useParams } from "revolution";

import { Type } from "../../components/api.tsx";
import { SitemapRoute } from "../../plugins/sitemap.ts";
import {
  PackageDocs,
  type RenderableDocNode,
} from "../../resources/package.ts";
import { Repository } from "../../resources/repository.ts";
import { useAppHtml } from "../app.html.tsx";

const uniquePredicate = (value: unknown, index: number, array: unknown[]) =>
  array.indexOf(value) === index;

function* getApiForLatestTag(
  repository: Repository,
  searchQuery: string,
): Operation<PackageDocs | undefined> {
  const latest = yield* repository.getLatestSemverTag(searchQuery);

  if (latest) {
    const ref = yield* repository.loadRef(`tags/${latest.name}`);
    const pkg = yield* ref.loadRootPackage();
    if (pkg) {
      return yield* pkg.docs();
    }
  }
}

export function apiSymbolRoute(library: Repository): SitemapRoute<JSXElement> {
  return {
    *routemap(generate) {
      const docs = yield* getApiForLatestTag(library, "effection-v3");

      if (docs) {
        return docs["."]
          .map((node) => node.name)
          .filter(uniquePredicate)
          .flatMap((symbol) => {
            return [
              {
                pathname: generate({ symbol }),
              },
            ];
          });
      } else {
        console.log(`Failed to load docs`);
      }

      return [];
    },
    handler: function* () {
      const { symbol } = yield* useParams<{ symbol: string }>();
      try {
        const docs = yield* getApiForLatestTag(library, "effection-v3");
        if (!docs) throw new Error(`Could not retreive docs`);

        const nodes = docs["."].filter((node) => node.name === symbol);
        const nodesByKind = aggregateGroups<
          RenderableDocNode,
          Record<string, RenderableDocNode[]>
        >(
          Object.groupBy(docs["."], (node) => node.kind),
          (current, _key, _first, accumulator = {}) => ({
            ...accumulator,
            ...{
              [current.name]: current.name in accumulator
                ? [...accumulator[current.name]]
                : [current],
            },
          }),
        );

        const elements: JSXElement[] = [];
        for (const node of nodes) {
          const { MDXDoc = () => <></> } = node;

          elements.push(
            <section id={node.id}>
              {yield* Type({ node })}
              <div class="pl-2 -mt-5">
                <MDXDoc />
              </div>
            </section>,
          );
        }

        const AppHtml = yield* useAppHtml({
          title: `${symbol} | API Reference | Effection`,
          description: nodes.find((node) => node.description)?.description ??
            "",
        });

        return (
          <AppHtml>
            <section class="min-h-0 mx-auto w-full justify-items-normal md:grid md:grid-cols-[225px_auto] lg:grid-cols-[225px_auto_200px] md:gap-4">
              <aside class="min-h-0 overflow-auto hidden md:block pt-2 top-24 sticky h-fit">
                <nav class="pl-4">
                  <h3 class="text-lg">API Reference</h3>
                  <Menu
                    nodes={{
                      ...nodesByKind.typeAlias,
                      ...nodesByKind.function,
                      ...nodesByKind.interface,
                    }}
                    current={symbol}
                  />
                </nav>
              </aside>
              <article class="prose max-w-full px-6 py-2">{elements}</article>
            </section>
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

function Menu({
  nodes,
  current,
}: {
  current: string;
  nodes: Record<string, RenderableDocNode[]>;
}) {
  return (
    <menu>
      {Object.keys(nodes)
        .sort()
        .map((name) => (
          <li>
            {current === name
              ? (
                <span class="rounded px-2 block w-full py-2 bg-gray-100 cursor-default ">
                  <Icon node={nodes[name][0]} />
                  {name}
                </span>
              )
              : (
                <a
                  class="rounded px-2 block w-full py-2 hover:bg-gray-100"
                  href={`/api/${name}`}
                >
                  <Icon node={nodes[name][0]} />
                  {name}
                </a>
              )}
          </li>
        ))}
    </menu>
  );
}

function Icon({ node }: { node: RenderableDocNode }) {
  switch (node.kind) {
    case "function":
      return (
        <span class="rounded-full bg-sky-100 inline-block w-6 h-full mr-1 text-center">
          f
        </span>
      );
    case "interface":
      return (
        <span class="rounded-full bg-orange-50 text-orange-600 inline-block w-6 h-full mr-1 text-center">
          I
        </span>
      );
    case "typeAlias":
      return (
        <span class="rounded-full bg-red-50 text-red-600 inline-block w-6 h-full mr-1 text-center">
          T
        </span>
      );
  }
  return <></>;
}
