import {
  all,
  call,
  createContext,
  Err,
  Ok,
  type Operation,
  type Result,
} from "effection";
import { SEPARATOR } from "jsr:@std/path@1.0.6";
import { z } from "npm:zod@3.23.8";
import type { JSXElement } from "revolution";

import { type DocNode, useDenoDoc } from "./use-deno-doc.tsx";
import { useMDX } from "./use-mdx.tsx";
import { useDescription } from "./use-description-parse.tsx";
import {
  PackageDetailsResult,
  PackageScoreResult,
  useJSRClient,
} from "./use-jsr-client.ts";
import { useRepository } from "./use-repository.ts";

export interface Package {
  /**
   * Location of the package on the file system
   */
  workspacePath: URL;
  /**
   * Name of the directory on the file system
   */
  workspace: string;
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
  readme: string;
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
  docs: Record<string, Array<RenderableDocNode>>;
  MDXContent: () => Operation<JSX.Element>;
  description: () => Operation<string>;
}

export type RenderableDocNode = DocNode & {
  id: string;
  description: string;
  MDXDoc?: () => JSXElement;
};

export const DenoJson = z.object({
  name: z.string(),
  version: z.string().optional(),
  exports: z.union([z.record(z.string()), z.string()]),
  private: z.union([z.undefined(), z.literal(true)]),
  license: z.string(),
});

export type PackageConfig = {
  readme: string;
  workspace: string;
  workspacePath: URL;
  denoJson: z.infer<typeof DenoJson>;
};

export const DEFAULT_MODULE_KEY = ".";

const PackageContext = createContext<Package>("package");

export function* initPackageContext(config: PackageConfig): Operation<Package> {
  const pkg = yield* createPackage(config);
  return yield* PackageContext.set(pkg);
}

export function* usePackage(): Operation<Package> {
  return yield* PackageContext;
}

export function ensureTrailingSlash(url: URL) {
  const isFile = url.pathname.split("/").at(-1)?.includes(".");
  if (isFile || url.pathname.endsWith("/")) {
    return url;
  }
  return new URL(`${url.toString()}/`);
}

function* readTextFile(url: URL): Operation<Result<string>> {
  return yield* call(async () => {
    try {
      const result = await Deno.readTextFile(url);
      return Ok(result);
    } catch (error) {
      return Err<string>(
        error instanceof Error ? error : new Error(`${error}`),
      );
    }
  });
}

export function* readPackageConfig(
  workspacePath: URL,
): Operation<PackageConfig> {
  const url = ensureTrailingSlash(workspacePath);
  const denoJsonUrl = new URL("./deno.json", url).toString();

  const { default: config } = yield* call(() =>
    import(
      denoJsonUrl,
      {
        with: { type: "json" },
      }
    )
  );

  const readme = yield* readTextFile(new URL("./README.md", url));

  const denoJson = DenoJson.parse(config);

  return {
    workspace: url.href.split(SEPARATOR).at(-2)!,
    workspacePath: url,
    denoJson,
    readme: readme.ok ? readme.value : readme.error.toString(),
  };
}

export function* createPackage(config: PackageConfig) {
  const repository = yield* useRepository();

  const exports = typeof config.denoJson.exports === "string"
    ? {
      [DEFAULT_MODULE_KEY]: config.denoJson.exports,
    }
    : config.denoJson.exports;

  const [, scope, name] = config.denoJson.name.match(/@(.*)\/(.*)/) ?? [];

  if (!scope) throw new Error(`Expected a scope but got ${scope}`);
  if (!name) throw new Error(`Expected a package name but got ${name}`);

  const entrypoints: Record<string, URL> = {};
  for (const key of Object.keys(exports)) {
    entrypoints[key] = new URL(exports[key], config.workspacePath);
  }

  let docs: Package["docs"] = {};
  for (const key of Object.keys(entrypoints)) {
    const url = String(entrypoints[key]);
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

  return {
    workspacePath: config.workspacePath,
    workspace: config.workspace,
    jsr: new URL(`./${config.denoJson.name}/`, "https://jsr.io/"),
    jsrBadge: new URL(`./${config.denoJson.name}`, "https://jsr.io/badges/"),
    npm: new URL(`./${config.denoJson.name}`, "https://www.npmjs.com/package/"),
    bundleSizeBadge: new URL(
      `./${config.denoJson.name}/${config.denoJson.version}`,
      "https://img.shields.io/bundlephobia/minzip/",
    ),
    npmVersionBadge: new URL(
      `./${config.denoJson.name}`,
      "https://img.shields.io/npm/v/",
    ),
    bundlephobia: new URL(
      `./${config.denoJson.name}/${config.denoJson.version}`,
      "https://bundlephobia.com/package/",
    ),
    dependencyCountBadge: new URL(
      `./${config.denoJson.name}`,
      "https://badgen.net/bundlephobia/dependency-count/",
    ),
    treeShakingSupportBadge: new URL(
      `./${config.denoJson.name}`,
      "https://badgen.net/bundlephobia/tree-shaking/",
    ),
    path: config.workspacePath,
    packageName: config.denoJson.name,
    scope,
    source: new URL(`./${config.workspace}/`, repository.defaultBranchUrl),
    name,
    exports,
    readme: config.readme,
    docs,
    version: config.denoJson.version,
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
      let mod = yield* useMDX(config.readme);

      return mod.default({});
    },
    *description(): Operation<string> {
      return yield* useDescription(config.readme);
    },
  };
}

function exportHash(exportName: string, doc: DocNode): string {
  if (exportName === DEFAULT_MODULE_KEY) {
    return doc.name;
  } else {
    return `${exportName}__${doc.name}`;
  }
}
