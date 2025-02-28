import { call, type Operation, useScope } from "effection";
import {
  CacheSetting,
  doc,
  type DocNode,
  type DocOptions,
  LoadResponse,
} from "jsr:@deno/doc@0.169.0";
import { createGraph } from "jsr:@deno/graph@0.89.0";
// @deno-types="npm:@types/parse-github-url@1.0.3";
import githubUrlParse from "npm:parse-github-url@1.0.3";

import { useDescription } from "./use-description-parse.tsx";
import { GithubClientContext } from "../context/github.ts";
import { exportHash, extract } from "../components/type/markdown.tsx";
import { DenoJson } from "../resources/package.ts";

export type { DocNode };

export function* useDenoDoc(
  specifiers: string[],
  docOptions?: DocOptions,
): Operation<Record<string, DocNode[]>> {
  return yield* call(() => doc(specifiers, docOptions));
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

export function* useDocPages(specifier: string): Operation<DocsPages> {
  const scope = yield* useScope();

  const loader = (specifier: string) => scope.run(docLoader(specifier));
  const imports = yield* extractImports(
    new URL("./deno.json", specifier).toString(),
    loader,
  );
  const resolve = imports
    ? (specifier: string, referrer: string) => {
        let resolved: string = specifier;
        if (specifier in imports) {
          resolved = imports[specifier];
        } else if (specifier.startsWith(".")) {
          resolved = new URL(specifier, referrer).toString();
        } else if (specifier.startsWith("node:")) {
          resolved = `npm:@types/node@^22.13.5`;
        }
        return resolved;
      }
    : undefined;

  const graph = yield* call(() =>
    createGraph([specifier], {
      load: loader,
      resolve,
    }),
  );

  const externalDependencies: Dependency[] = graph.modules.flatMap((module) => {
    if (module.kind === "external") {
      const parts = module.specifier.match(/(.*):(.*)@(.*)/);
      if (parts) {
        const [, source, name, version] = parts;
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

  const docs = yield* useDenoDoc([specifier], {
    load: loader,
    resolve,
  });

  const entrypoints: Record<string, DocPage[]> = {};

  for (const [url, all] of Object.entries(docs)) {
    const pages: DocPage[] = [];
    for (const [symbol, nodes] of Object.entries(
      Object.groupBy(all, (node) => node.name),
    )) {
      if (nodes) {
        const sections: DocPageSection[] = [];
        for (const node of nodes) {
          const { markdown, ignore, pages: _pages } = yield* extract(node);
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

        const markdown = sections
          .map((s) => s.markdown)
          .filter((m) => m)
          .join("");

        const description = yield* useDescription(markdown);

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
    const github = yield* GithubClientContext.expect();

    const url = URL.parse(specifier);

    if (url?.host === "github.com") {
      const gh = githubUrlParse(specifier);
      if (gh && gh.owner && gh.name && gh.filepath) {
        const result = yield* call(() =>
          github.rest.repos.getContent({
            owner: gh.owner!,
            repo: gh.name!,
            path: gh.filepath!,
            ref: gh.branch,
            mediaType: {
              format: "raw",
            },
          }),
        );
        return {
          kind: "module",
          specifier,
          content: `${result.data}`,
        };
      } else {
        throw new Error(`Could not parse ${specifier} as Github URL`);
      }
    }

    if (url?.host === "jsr.io") {
      console.log(`Ignoring ${url} while reading docs`);
    }
  };
}

export function isDocsPages(value: unknown): value is DocsPages {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // Check if each key is a string and value is an array of DocPage objects
  for (const key in value) {
    if (typeof key !== "string") {
      return false;
    }

    const pages = (value as Record<string, unknown>)[key];

    if (!Array.isArray(pages)) {
      return false;
    }

    // Check if each item in the array is a valid DocPage
    for (const page of pages) {
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

  const page = value as DocPage;

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

  const section = value as DocPageSection;

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

  const dependency = value as Dependency;

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
  const module = yield* loader(url);

  if (!module) return;
  const content =
    module.kind === "module" ? JSON.parse(`${module.content}`) : undefined;
  const { imports } = DenoJson.parse(content);

  return imports;
}
