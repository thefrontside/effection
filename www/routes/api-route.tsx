import denoJson from "../../deno.json" with { type: "json" };

import { call } from "effection";
import { Type } from "effection-contrib/www/components/api.tsx";
import {
  createPackage,
  type RenderableDocNode,
} from "effection-contrib/www/hooks/use-package.tsx";
import { aggregateGroups } from "jsr:@std/collections@1.0.9";
import { type JSXElement } from "revolution";

import { SitemapRoute } from "../plugins/sitemap.ts";
import { useAppHtml } from "./app.html.tsx";
import { navLinks } from "./index-route.tsx";

function* effectionPkgConfig() {
  return {
    workspace: "effection",
    workspacePath: new URL("./../../", import.meta.url),
    readme: yield* call(() => Deno.readTextFile("../README.md")),
    denoJson,
  };
}

const uniquePredicate = (value: unknown, index: number, array: unknown[]) =>
  array.indexOf(value) === index;

export function apiRoute(): SitemapRoute<JSXElement> {
  return {
    *routemap(generate) {
      const config = yield* effectionPkgConfig();
      const pkg = yield* createPackage(config);

      return pkg.docs["."]
        .map((node) => node.name)
        .filter(uniquePredicate)
        .flatMap((symbol) => {
          return [
            {
              pathname: generate({ symbol }),
            },
          ];
        });
    },
    handler: function* () {
      const AppHtml = yield* useAppHtml({ title: "API Reference " });

      const config = yield* effectionPkgConfig();
      const pkg = yield* createPackage(config);
      const nodes = pkg.docs["."].filter((node) => node.name === symbol);
      const nodesByKind = aggregateGroups<
        RenderableDocNode,
        Record<string, RenderableDocNode[]>
      >(
        Object.groupBy(pkg.docs["."], (node) => node.kind),
        (current, _key, _first, accumulator = {}) => ({
          ...accumulator,
          ...{
            [current.name]:
              current.name in accumulator
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

      return (
        <AppHtml navLinks={navLinks}>
          <section class="min-h-0 mx-auto w-full justify-items-normal md:grid md:grid-cols-[225px_auto] lg:grid-cols-[225px_auto_200px] md:gap-4">
            <aside class="min-h-0 overflow-auto hidden md:block pt-2 top-24 sticky h-fit">
              <nav class="pl-4">
                {nodesByKind.function ? (
                  <hgroup class="mb-2">
                    <h3 class="text-lg">Functions</h3>
                    <Menu nodes={nodesByKind.function} current={symbol} />
                  </hgroup>
                ) : (
                  <></>
                )}
                {nodesByKind.interface ? (
                  <hgroup class="mb-2">
                    <h3 class="text-lg">Interfaces</h3>
                    <Menu nodes={nodesByKind.interface} current={symbol} />
                  </hgroup>
                ) : (
                  <></>
                )}
                {nodesByKind.typeAlias ? (
                  <hgroup class="mb-2">
                    <h3 class="text-lg">Type Aliases</h3>
                    <Menu nodes={nodesByKind.typeAlias} current={symbol} />
                  </hgroup>
                ) : (
                  <></>
                )}
              </nav>
            </aside>
            <article class="prose max-w-full px-6 py-2">{elements}</article>
          </section>
        </AppHtml>
      );
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
      {Object.keys(nodes).map((name) => (
        <li>
          {current === name ? (
            <span class="rounded px-4 block w-full py-2 bg-gray-100 cursor-default ">
              {name}
            </span>
          ) : (
            <a
              class="rounded px-4 block w-full py-2 hover:bg-gray-100"
              href={`/api/${name}`}
            >
              {name}
            </a>
          )}
        </li>
      ))}
    </menu>
  );
}
