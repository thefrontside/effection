import {
  CacheSetting,
  doc,
  type DocNode,
  type DocOptions,
  LoadResponse,
  Location,
} from "@deno/doc";
import { call, type Operation, until, useScope } from "effection";
import { createGraph } from "@deno/graph";
import { regex } from "arktype";

import { exportHash, extract } from "../components/type/markdown.tsx";
import { operations } from "../context/fetch.ts";
import { DenoJsonSchema } from "../lib/deno-json.ts";
import { useDescription } from "./use-description-parse.tsx";

// Matches npm/jsr specifiers like @std/testing/bdd or lodash/fp
export const npmSpecifierPattern = regex(
  "^(?:(?<scope>@[^/]+)/)?(?<package>[^/]+)(?<subpath>/.*)?$",
);

export type { DocNode };

export function* useDenoDoc(
  specifiers: string[],
  docOptions?: DocOptions,
): Operation<Record<string, DocNode[]>> {
  let docs = yield* until(doc(specifiers, docOptions));
  return docs;
}

export interface Dependency {
  source: string;
  name: string;
  version: string;
}

export interface DocPage {
  name: string;
  sections: DocPageSection[];
  description: string;
  kind: DocNode["kind"];
  dependencies: Dependency[];
}

export interface DocPageSection {
  id: string;

  node: DocNode;

  markdown?: string;

  ignore: boolean;
}

export type DocsPages = Record<string, DocPage[]>;

export function* useDocPages(
  specifier: string,
  imports?: Record<string, string>,
): Operation<DocsPages> {
  let scope = yield* useScope();

  let loader = (specifier: string) => scope.run(docLoader(specifier));

  // If imports not provided, try to extract from deno.json
  let resolvedImports = imports ?? (yield* extractImports(
    new URL("./deno.json", specifier).toString(),
    loader,
  ));

  let resolve = resolvedImports
    ? (specifier: string, referrer: string) => {
      let resolved: string = specifier;
      if (specifier in resolvedImports) {
        resolved = resolvedImports[specifier];
      } else if (specifier.startsWith(".")) {
        resolved = new URL(specifier, referrer).toString();
      } else if (specifier.startsWith("node:")) {
        resolved = `npm:@types/node@^22.13.5`;
      } else {
        let match = npmSpecifierPattern.exec(specifier);
        if (match) {
          let { scope, package: pkg, subpath } = match.groups;
          let baseKey = scope ? `${scope}/${pkg}` : pkg;
          if (baseKey in resolvedImports) {
            let baseUrl = resolvedImports[baseKey];
            resolved = subpath ? `${baseUrl}${subpath}` : baseUrl;
          }
        }
      }
      return resolved;
    }
    : undefined;

  let graph = yield* call(() =>
    createGraph([specifier], {
      load: loader,
      resolve,
    })
  );

  let externalDependencies: Dependency[] = graph.modules.flatMap((module) => {
    if (module.kind === "external") {
      let parts = module.specifier.match(/(.*):(.*)@(.*)/);
      if (parts) {
        let [, source, name, version] = parts;
        return [
          {
            source,
            name,
            version,
          },
        ];
      }
    }
    return [];
  });

  let docs = yield* useDenoDoc([specifier], {
    load: loader,
    resolve,
  });

  let entrypoints: Record<string, DocPage[]> = {};

  for (let [url, all] of Object.entries(docs)) {
    let pages: DocPage[] = [];
    for (
      let [symbol, nodes] of Object.entries(
        Object.groupBy(all, (node) => node.name),
      )
    ) {
      if (nodes) {
        let sections: DocPageSection[] = [];
        for (let node of nodes) {
          let { markdown, ignore, pages: _pages } = yield* extract(node);
          sections.push({
            id: exportHash(node, sections.length),
            node,
            markdown,
            ignore,
          });
          pages.push(
            ..._pages.map((page) => ({
              ...page,
              dependencies: externalDependencies,
            })),
          );
        }

        let markdown = sections
          .map((s) => s.markdown)
          .filter((m) => m)
          .join("");

        let description = yield* useDescription(markdown);

        pages.push({
          name: symbol,
          kind: nodes?.at(0)?.kind!,
          description,
          sections,
          dependencies: externalDependencies,
        });
      }
    }

    entrypoints[url] = pages;
  }

  return entrypoints;
}

function docLoader(
  specifier: string,
  _isDynamic?: boolean,
  _cacheSetting?: CacheSetting,
  _checksum?: string,
): () => Operation<LoadResponse | undefined> {
  return function* downloadDocModules() {
    let url = URL.parse(specifier);

    if (url?.protocol.startsWith("file")) {
      let content = yield* until(Deno.readTextFile(url.pathname));
      return {
        kind: "module",
        specifier,
        content,
      };
    }

    if (url?.host && ["github.com", "jsr.io"].includes(url.host)) {
      let response = yield* operations.fetch(specifier);
      let content = yield* until(response.text());
      if (response.ok) {
        return {
          kind: "module",
          specifier,
          content,
        };
      } else {
        throw new Error(`Could not parse ${specifier} as Github URL`, {
          cause: response,
        });
      }
    } else {
      console.log(`Ignoring ${url} while reading docs`);
    }
  };
}

export function isDocsPages(value: unknown): value is DocsPages {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // Check if each key is a string and value is an array of DocPage objects
  for (let key in value) {
    if (typeof key !== "string") {
      return false;
    }

    let pages = (value as Record<string, unknown>)[key];

    if (!Array.isArray(pages)) {
      return false;
    }

    // Check if each item in the array is a valid DocPage
    for (let page of pages) {
      if (!isDocPage(page)) {
        return false;
      }
    }
  }

  return true;
}

function isDocPage(value: unknown): value is DocPage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  let page = value as DocPage;

  return (
    typeof page.name === "string" &&
    Array.isArray(page.sections) &&
    page.sections.every(isDocPageSection) &&
    typeof page.description === "string" &&
    typeof page.kind === "string" &&
    Array.isArray(page.dependencies) &&
    page.dependencies.every(isDependency)
  );
}

function isDocPageSection(value: unknown): value is DocPageSection {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  let section = value as DocPageSection;

  return (
    typeof section.id === "string" &&
    typeof section.node === "object" &&
    section.node !== null && // You might need a guard for DocNode if it's complex
    (typeof section.markdown === "undefined" ||
      typeof section.markdown === "string") &&
    typeof section.ignore === "boolean"
  );
}

function isDependency(value: unknown): value is Dependency {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  let dependency = value as Dependency;

  return (
    typeof dependency.source === "string" &&
    typeof dependency.name === "string" &&
    typeof dependency.version === "string"
  );
}

function* extractImports(
  url: string,
  loader: (specifier: string) => Operation<LoadResponse | undefined>,
) {
  let module = yield* loader(url);
  if (!module) return;
  let content = module.kind === "module"
    ? JSON.parse(`${module.content}`)
    : undefined;
  let { imports } = DenoJsonSchema.parse(content);

  return imports;
}

/**
 * LocalDocsPages are DocNodes that are stored locally
 * but they represent symbols hosted on GitHub. They
 * have LocalDocNode locations that include URLs to GitHub.
 */
export type LocalDocsPages = Record<string, LocalDocPage[]>;

export type LocalDocPage = DocPage & { sections: LocalDocPageSection[] };

export type LocalDocPageSection = DocPageSection & {
  node: LocalDocNode;
};

export type LocalDocNode = DocNode & {
  location: LocalLocation;
};

export type LocalLocation = Location & {
  url: URL;
};
