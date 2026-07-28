import {
  CacheSetting,
  type Declaration,
  doc,
  type DocOptions,
  type Document,
  LoadResponse,
  Location,
  type Symbol as DocSymbol,
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

/**
 * A symbol's identity without its declarations.
 *
 * `@deno/doc` v2 groups a module's declarations under a `Symbol` ({ name,
 * isDefault?, declarations }). Renderers only need the identity (name /
 * isDefault), not the sibling declarations — which would duplicate the
 * per-section `Declaration`s — so they take a `SymbolInfo`. A full `Symbol` is
 * structurally assignable to it, so build-time code can pass the real Symbol.
 */
export type SymbolInfo = Omit<DocSymbol, "declarations">;

export function* useDenoDoc(
  specifiers: string[],
  docOptions?: DocOptions,
): Operation<Record<string, Document>> {
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
  kind: Declaration["kind"];
  dependencies: Dependency[];
  /**
   * True when this symbol is exported from the package's `./experimental`
   * entrypoint. Drives the "experimental" badge and the namespaced doc URL.
   */
  experimental?: boolean;
}

export interface DocPageSection {
  id: string;

  declaration: Declaration;

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
    ? (specifier: string, referrer: string) =>
      resolveDocSpecifier(specifier, referrer, resolvedImports)
    : undefined;

  let graph = yield* call(() =>
    createGraph([specifier], {
      load: loader,
      resolve,
    })
  );

  let externalDependencies: Dependency[] = graph.modules.flatMap((module) => {
    if (module.kind === "external") {
      let parts = module.specifier.match(/^(npm|jsr):(.+)@([^@]+)$/);
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

  for (let [url, document] of Object.entries(docs)) {
    let pages: DocPage[] = [];
    for (let symbol of document.symbols) {
      // v2 groups declarations under a symbol; render each declaration as a
      // section, passing the owning symbol for its name/identity.
      let sections: DocPageSection[] = [];
      for (let declaration of symbol.declarations) {
        let { markdown, ignore, pages: _pages } = yield* extract(
          declaration,
          symbol,
        );
        sections.push({
          id: exportHash(declaration, symbol, sections.length),
          declaration,
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
        name: symbol.name,
        kind: symbol.declarations.at(0)?.kind!,
        description,
        sections,
        dependencies: externalDependencies,
      });
    }

    entrypoints[url] = pages;
  }

  return entrypoints;
}

export function resolveDocSpecifier(
  specifier: string,
  referrer: string,
  imports: Record<string, string>,
): string {
  if (specifier in imports) {
    return imports[specifier];
  }
  if (specifier.startsWith(".")) {
    return new URL(specifier, referrer).toString();
  }
  if (specifier.startsWith("node:")) {
    return "npm:@types/node@^22.13.5";
  }
  if (URL.parse(specifier)) {
    return specifier;
  }

  let match = npmSpecifierPattern.exec(specifier);
  if (match) {
    let { scope, package: pkg, subpath } = match.groups;
    let baseKey = scope ? `${scope}/${pkg}` : pkg;
    if (baseKey in imports) {
      let baseUrl = imports[baseKey];
      return subpath ? `${baseUrl}${subpath}` : baseUrl;
    }
    return `external:${specifier}`;
  }

  return specifier;
}

export function docLoader(
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
    }

    return {
      kind: "external",
      specifier,
    };
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
    typeof section.declaration === "object" &&
    section.declaration !== null &&
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
 * LocalDocsPages are declarations that are stored locally
 * but they represent symbols hosted on GitHub. They
 * have LocalDeclaration locations that include URLs to GitHub.
 */
export type LocalDocsPages = Record<string, LocalDocPage[]>;

export type LocalDocPage = DocPage & { sections: LocalDocPageSection[] };

export type LocalDocPageSection = DocPageSection & {
  declaration: LocalDeclaration;
};

export type LocalDeclaration = Declaration & {
  location: LocalLocation;
};

export type LocalLocation = Location & {
  url: URL;
};
