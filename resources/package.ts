import { all, type Operation, resource } from "effection";
import { z } from "npm:zod@3.23.8";
import type { JSXElement } from "revolution";

import { type DocNode, useDenoDoc } from "../hooks/use-deno-doc.tsx";
import { useMDX } from "../hooks/use-mdx.tsx";
import { useDescription } from "../hooks/use-description-parse.tsx";
import {
  PackageDetailsResult,
  PackageScoreResult,
  useJSRClient,
} from "../hooks/use-jsr-client.ts";
import { RepositoryRef } from "./repository-ref.ts";

export interface Package {
  /**
   * Relative path of workspace on file system
   */
  path: string;
  /**
   * Name of the scope (without @) - should be effection-contrib
   */
  scope: string;
  /**
   * Name of the package without the scope
   */
  name: string;
  /**
   * Full package name from deno.json#name
   */
  packageName: string;
  /**
   * Package version in the repository
   */
  version?: string;
  /**
   * Source code URL
   */
  source: URL;
  /**
   * URL of the package on JSR
   */
  jsr: URL;
  /**
   * URL of the package on JSR
   */
  jsrBadge: URL;
  /**
   * URL of package on npm
   */
  npm: URL;
  /**
   * URL of badge for version published on npm
   */
  npmVersionBadge: URL;
  /**
   * Contents of the README.md file
   */
  readme(): Operation<string>;
  /**
   * Normalized exports from deno.json file
   */
  exports: Record<string, string>;
  /**
   * Bundle size badge from bundlephobia
   */
  bundleSizeBadge: URL;
  /**
   * Bundlephobia URL
   */
  bundlephobia: URL;
  /**
   * Dependency Count Badge
   */
  dependencyCountBadge: URL;
  /**
   * Tree Shaking Support Badge URL
   */
  treeShakingSupportBadge: URL;
  entrypoints: Record<string, URL>;
  /**
   * JSR Score
   */
  jsrPackageDetails: () => Operation<
    [
      z.SafeParseReturnType<unknown, PackageDetailsResult>,
      z.SafeParseReturnType<unknown, PackageScoreResult>,
    ]
  >;
  /**
   * Generated docs
   */
  docs(): Operation<PackageDocs>;
  MDXContent(): Operation<JSX.Element>;
  description(): Operation<string>;
}

export type RenderableDocNode = DocNode & {
  id: string;
  description: string;
  MDXDoc?: () => JSXElement;
};

export const DenoJson = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  exports: z.union([z.record(z.string()), z.string()]).optional(),
  license: z.string().optional(),
  workspace: z.array(z.string()).optional(),
});

export type DenoJsonType = z.infer<typeof DenoJson>;

export type PackageDocs = Record<string, Array<RenderableDocNode>>;

export const DEFAULT_MODULE_KEY = ".";

export function loadPackage(
  { ref, workspacePath }: { workspacePath: string; ref: RepositoryRef },
) {
  return resource<Package>(function* (provide) {
    const denoJson = yield* ref.loadDenoJson();

    const [, scope, name] = denoJson.name.match(/@(.*)\/(.*)/) ?? [];

    if (!scope) throw new Error(`Expected a scope but got ${scope}`);
    if (!name) throw new Error(`Expected a package name but got ${name}`);

    let docs: PackageDocs;

    let pkg: Package = {
      get exports() {
        if (typeof denoJson.exports === "string") {
          return { [DEFAULT_MODULE_KEY]: denoJson.exports };
        } else {
          return denoJson.exports;
        }
      },
      path: workspacePath,
      jsr: new URL(`./${denoJson.name}/`, "https://jsr.io/"),
      jsrBadge: new URL(`./${denoJson.name}`, "https://jsr.io/badges/"),
      npm: new URL(`./${denoJson.name}`, "https://www.npmjs.com/package/"),
      bundleSizeBadge: new URL(
        `./${denoJson.name}/${denoJson.version}`,
        "https://img.shields.io/bundlephobia/minzip/",
      ),
      npmVersionBadge: new URL(
        `./${denoJson.name}`,
        "https://img.shields.io/npm/v/",
      ),
      bundlephobia: new URL(
        `./${denoJson.name}/${denoJson.version}`,
        "https://bundlephobia.com/package/",
      ),
      dependencyCountBadge: new URL(
        `./${denoJson.name}`,
        "https://badgen.net/bundlephobia/dependency-count/",
      ),
      treeShakingSupportBadge: new URL(
        `./${denoJson.name}`,
        "https://badgen.net/bundlephobia/tree-shaking/",
      ),
      packageName: denoJson.name,
      scope,
      source: new URL(workspacePath, ref.name),
      name,
      *readme() {
        return yield* ref.loadReadme();
      },
      get entrypoints() {
        const entrypoints: Record<string, URL> = {};
        for (const key of Object.keys(exports)) {
          entrypoints[key] = new URL(exports[key], workspacePath);
        }
        return entrypoints;
      },
      *docs() {
        if (docs) {
          return docs;
        } else {
          docs = {};
        }
        for (const key of Object.keys(pkg.entrypoints)) {
          const url = String(pkg.entrypoints[key]);
          const docNodes = yield* useDenoDoc([url]);
          docs[key] = yield* all(
            docNodes[url].map(function* (node) {
              if (node.jsDoc && node.jsDoc.doc) {
                try {
                  const mod = yield* useMDX(node.jsDoc.doc);
                  return {
                    id: exportHash(key, node),
                    ...node,
                    description: yield* useDescription(node.jsDoc.doc),
                    MDXDoc: () => mod.default({}),
                  };
                } catch (e) {
                  console.error(
                    `Could not parse doc string for ${node.name} at ${node.location}`,
                    e,
                  );
                }
              }
              return {
                id: exportHash(key, node),
                description: "",
                ...node,
              };
            }),
          );
        }
        return docs;
      },
      version: denoJson.version,
      *jsrPackageDetails(): Operation<
        [
          z.SafeParseReturnType<unknown, PackageDetailsResult>,
          z.SafeParseReturnType<unknown, PackageScoreResult>,
        ]
      > {
        const client = yield* useJSRClient();
        const [details, score] = yield* all([
          client.getPackageDetails({ scope, package: name }),
          client.getPackageScore({ scope, package: name }),
        ]);

        if (!details.success) {
          console.info(
            `JSR package details response failed validation`,
            details.error.format(),
          );
        }

        if (!score.success) {
          console.info(
            `JSR score response failed validation`,
            score.error.format(),
          );
        }

        return [details, score];
      },
      *MDXContent(): Operation<JSX.Element> {
        let readme = yield* pkg.readme();
        let mod = yield* useMDX(readme);

        return mod.default({});
      },
      *description(): Operation<string> {
        let readme = yield* pkg.readme();
        return yield* useDescription(readme);
      },
    };

    yield* provide(pkg);
  });
}

function exportHash(exportName: string, doc: DocNode): string {
  if (exportName === DEFAULT_MODULE_KEY) {
    return doc.name;
  } else {
    return `${exportName}__${doc.name}`;
  }
}
