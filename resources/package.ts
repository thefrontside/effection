import { all, type Operation, resource } from "effection";

import { z } from "npm:zod@3.23.8";

import { useJSRClient } from "../context/jsr.ts";
import { DocsPages, useDocPages } from "../hooks/use-deno-doc.tsx";
import { useDescription, useTitle } from "../hooks/use-description-parse.tsx";
import { useMDX } from "../hooks/use-mdx.tsx";
import { PackageDetailsResult, PackageScoreResult } from "./jsr-client.ts";
import { RepositoryRef } from "./repository-ref.ts";

export interface Package {
  ref: RepositoryRef;
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
  docs(): Operation<DocsPages>;
  MDXContent(): Operation<JSX.Element>;
  title(): Operation<string>;
  description(): Operation<string>;
}

export const DenoJson = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  exports: z.union([z.record(z.string()), z.string()]).optional(),
  license: z.string().optional(),
  workspace: z.array(z.string()).optional(),
});

export type DenoJsonType = z.infer<typeof DenoJson>;

export const DEFAULT_MODULE_KEY = ".";

export function loadPackage(
  { ref, workspacePath }: { workspacePath: string; ref: RepositoryRef },
) {
  return resource<Package>(function* (provide) {
    const denoJson = yield* ref.loadDenoJson(workspacePath);

    const [, scope, name] = denoJson?.name?.match(/@(.*)\/(.*)/) ?? [];

    let pkg: Package = {
      ref,
      get exports() {
        if (typeof denoJson.exports === "string") {
          return { [DEFAULT_MODULE_KEY]: denoJson.exports };
        } else if (denoJson.exports === undefined) {
          return { [DEFAULT_MODULE_KEY]: "./mod.ts" };
        } else {
          return denoJson.exports;
        }
      },
      path: workspacePath,
      jsr: new URL(`./${denoJson.name}/`, "https://jsr.io/"),
      jsrBadge: new URL(`./${denoJson.name}`, "https://jsr.io/badges/"),
      npm: new URL(`./${denoJson.name}`, "https://www.npmjs.com/package/"),
      bundleSizeBadge: new URL(
        `./${denoJson.name}@${denoJson.version}`,
        "https://img.shields.io/bundlephobia/minzip/",
      ),
      npmVersionBadge: new URL(
        `./${denoJson.name}`,
        "https://img.shields.io/npm/v/",
      ),
      bundlephobia: new URL(
        `./${denoJson.name}@${denoJson.version}`,
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
      packageName: denoJson.name ?? "",
      scope,
      source: ref.getUrl(workspacePath),
      name,
      *readme() {
        return yield* ref.loadReadme(workspacePath);
      },
      get entrypoints() {
        const entrypoints: Record<string, URL> = {};
        for (const key of Object.keys(pkg.exports)) {
          entrypoints[key] = ref.getUrl(workspacePath, pkg.exports[key], true);
        }
        return entrypoints;
      },
      *docs() {
        const docs: DocsPages = {};

        for (const [entrypoint, url] of Object.entries(pkg.entrypoints)) {
          const pages = yield* useDocPages(`${url}`);

          docs[entrypoint] = pages[`${url}`];
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
      *title(): Operation<string> {
        let readme = yield* pkg.readme();
        return yield* useTitle(readme);
      },
      *description(): Operation<string> {
        let readme = yield* pkg.readme();
        return yield* useDescription(readme);
      },
    };

    yield* provide(pkg);
  });
}
