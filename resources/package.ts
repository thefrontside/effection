import { all, call, type Operation, resource, useScope } from "effection";
import { CacheSetting, LoadResponse } from "jsr:@deno/doc@0.162.4";
import { z } from "npm:zod@3.23.8";
// @deno-types="npm:@types/parse-github-url@1.0.3";
import githubUrlParse from "npm:parse-github-url@1.0.3";

import { GithubClientContext } from "../context/github.ts";
import { useJSRClient } from "../context/jsr.ts";
import { DocPage, useDenoDoc, useDocPages } from "../hooks/use-deno-doc.tsx";
import { useDescription } from "../hooks/use-description-parse.tsx";
import { useMDX } from "../hooks/use-mdx.tsx";
import { PackageDetailsResult, PackageScoreResult } from "./jsr-client.ts";
import { RepositoryRef } from "./repository-ref.ts";
import { defaultLinkResolver, ResolveLinkFunction } from "../hooks/use-markdown.tsx";

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
  docs({ linkResolver }: { linkResolver: ResolveLinkFunction }): Operation<PackageDocs>;
  MDXContent(): Operation<JSX.Element>;
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

export type PackageDocs = Record<string, DocPage[]>;

export const DEFAULT_MODULE_KEY = ".";

export function loadPackage(
  { ref, workspacePath }: { workspacePath: string; ref: RepositoryRef },
) {
  return resource<Package>(function* (provide) {
    const denoJson = yield* ref.loadDenoJson(workspacePath);

    const [, scope, name] = denoJson?.name?.match(/@(.*)\/(.*)/) ?? [];

    let pkg: Package = {
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
      source: new URL(ref.url),
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
      *docs(options = { linkResolver: defaultLinkResolver }) {
        const scope = yield* useScope();

        const docs: PackageDocs = {};

        for (const [entrypoint, url] of Object.entries(pkg.entrypoints)) {

          const result = yield* useDenoDoc([`${url}`], {
            load: (specifier: string) => scope.run(docLoader(specifier)),
          });

          const pages = yield* useDocPages(result, { linkResolver: options.linkResolver });
          
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
      *description(): Operation<string> {
        let readme = yield* pkg.readme();
        return yield* useDescription(readme);
      },
    };

    yield* provide(pkg);
  });
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
          })
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