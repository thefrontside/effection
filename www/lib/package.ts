import { all, Operation, until } from "effection";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";

import z from "zod";
import { findSeries, type SeriesConfig, useConfig } from "../context/config.ts";
import { useJSRClient } from "../context/jsr.ts";
import { LocalDocsPages, useDocPages } from "../hooks/use-deno-doc.tsx";
import { useDescription, useTitle } from "../hooks/use-description-parse.tsx";
import { useMDX } from "../hooks/use-mdx.tsx";
import {
  PackageDetailsResult,
  PackageScoreResult,
} from "../resources/jsr-client.ts";
import { DenoJson, useDenoJson } from "./deno-json.ts";
import { createRepo, Ref } from "./repo.ts";
import { extractVersion, findLatestSemverTag } from "./semver.ts";
import { useWorktree } from "./worktrees.ts";

export type WorkTreePackageOptions = {
  type: "worktree";
  /** Series name, e.g., "v4", "v4-next" */
  series: string;
  /** Override series config (optional, will look up from SiteConfig if not provided) */
  seriesConfig?: SeriesConfig;
};

export type ClonePackageOptions = {
  type: "clone";
  name?: string;
  path: string;
  workspacePath: string;
  ref: Ref;
};

export type PackageOptions = WorkTreePackageOptions | ClonePackageOptions;

export interface Package {
  name: string;
  scopeName: string;
  version: string;
  workspacePath: string;
  ref: Ref;
  exports: Record<string, string>;
  entrypoints: Record<string, URL>;
  docs: () => Operation<LocalDocsPages>;
  workspaces: string[];
  jsrPackageDetails: () => Operation<
    [
      z.SafeParseReturnType<unknown, PackageDetailsResult> | null,
      z.SafeParseReturnType<unknown, PackageScoreResult> | null,
    ]
  >;
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
  MDXContent: () => Operation<JSX.Element>;
  title: () => Operation<string>;
  description: () => Operation<string>;
  readme(): Operation<string>;
}

//TODO: cache package
export function* usePackage(options: PackageOptions): Operation<Package> {
  if (options.type === "worktree") {
    let repo = createRepo({ name: "effection", owner: "thefrontside" });

    // Get series config from options or look it up
    let seriesConfig = options.seriesConfig;
    if (!seriesConfig) {
      let config = yield* useConfig();
      seriesConfig = findSeries(config, options.series);
      if (!seriesConfig) {
        throw new Error(`unknown series: ${options.series}`);
      }
    }

    // Fetch all tags for this major version
    let tags = yield* repo.tags(
      new RegExp(`effection-v${seriesConfig.major}.*`),
    );

    // Use semver range to find latest (excludes prereleases unless configured)
    let range = `${seriesConfig.major}.x`;
    let ref = findLatestSemverTag(tags, range, {
      includePrerelease: seriesConfig.includePrerelease,
    });

    if (!ref) {
      throw new Error(`unable to find package ref for ${options.series}`);
    }

    let path = yield* useWorktree(ref.name);

    let denoJson = yield* useDenoJson(`${path}/deno.json`);

    let version = extractVersion(ref.name);

    return yield* initPackage("effection", path, ".", version, ref, denoJson);
  } else {
    let { path, workspacePath, ref } = options;
    let denoJson = yield* useDenoJson(`${path}/deno.json`);

    let name = options.name || denoJson.name || "UNKNOWN_PACKAGE";

    let version = denoJson.version ?? "main";

    return yield* initPackage(
      name,
      path,
      workspacePath,
      version,
      ref,
      denoJson,
    );
  }
}

function* initPackage(
  name: string,
  path: string,
  workspacePath: string,
  version: string,
  ref: Ref,
  denoJson: DenoJson,
): Operation<Package> {
  let [, scope] = denoJson?.name?.match(/@(.*)\/(.*)/) ?? [];
  let pkg: Package = {
    name,
    scopeName: scope,
    workspacePath,
    version,
    ref,
    get exports() {
      if (typeof denoJson.exports === "string") {
        return { ["."]: denoJson.exports };
      } else if (denoJson.exports === undefined) {
        return { ["."]: "./mod.ts" };
      } else {
        return denoJson.exports;
      }
    },
    get entrypoints() {
      let entrypoints: Record<string, URL> = {};
      for (let key of Object.keys(pkg.exports)) {
        entrypoints[key] = new URL(pkg.exports[key], `file://${path}/`);
      }
      return entrypoints;
    },
    *docs() {
      let docs: LocalDocsPages = {};

      for (let [entrypoint, url] of Object.entries(pkg.entrypoints)) {
        let pages = yield* useDocPages(`${url}`);

        docs[entrypoint] = pages[`${url}`].map((page) => {
          return {
            ...page,
            sections: page.sections.map((section) => ({
              ...section,
              node: {
                ...section.node,
                location: {
                  ...section.node.location,
                  url: new URL(
                    `${
                      relative(
                        path,
                        fileURLToPath(section.node.location.filename),
                      )
                    }#L${section.node.location.line}`,
                    `${ref.url}/`,
                  ),
                },
              },
            })),
          };
        });
      }

      return docs;
    },
    get workspaces() {
      return denoJson.workspace ?? [];
    },
    jsr: new URL(`./${denoJson.name}/`, "https://jsr.io/"),
    jsrBadge: new URL(`./${denoJson.name}`, "https://jsr.io/badges/"),
    npm: new URL(`./${denoJson.name}`, "https://www.npmjs.com/package/"),
    npmVersionBadge: new URL(
      `./${denoJson.name}`,
      "https://img.shields.io/npm/v/",
    ),
    *jsrPackageDetails(): Operation<
      [
        z.SafeParseReturnType<unknown, PackageDetailsResult> | null,
        z.SafeParseReturnType<unknown, PackageScoreResult> | null,
      ]
    > {
      let [, packageName] = name.split("/");
      let client = yield* useJSRClient();
      try {
        let [details, score] = yield* all([
          client.getPackageDetails({ scope, package: packageName }),
          client.getPackageScore({ scope, package: packageName }),
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
      } catch (e) {
        console.error(e);
      }

      return [null, null];
    },

    readme: () => until(Deno.readTextFile(`${path}/README.md`)),

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

  return pkg;
}
