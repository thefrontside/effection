import z from "zod";
import type { Operation } from "effection";
import { until } from "effection";
import { relative } from "@std/path";
import { fileURLToPath } from "node:url";
import type { Package, PackageManifest, Ref } from "./types.ts";
import type { LocalDocsPages } from "../../hooks/use-deno-doc.tsx";
import { registries } from "../registries/mod.ts";
import { useDocPages } from "../../hooks/use-deno-doc.tsx";
import { useMDX } from "../../hooks/use-mdx.tsx";
import {
  useTitle,
  useDescription,
} from "../../hooks/use-description-parse.tsx";

/**
 * Zod schema for Node exports field conditions.
 * Supports conditional exports with "development" and "default" conditions.
 */
const ExportConditionsSchema = z.object({
  development: z.string().optional(),
  default: z.string().optional(),
});

/**
 * Zod schema for package.json exports field.
 * Can be a string, conditional object, or a record of entrypoints.
 * Note: z.record must come before ExportConditionsSchema because
 * ExportConditionsSchema with all optional fields would match any object.
 */
const ExportsSchema = z.union([
  z.string(),
  z.record(z.union([z.string(), ExportConditionsSchema])),
  ExportConditionsSchema,
]);

/**
 * Zod schema for package.json files.
 */
export const PackageJsonSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  exports: ExportsSchema.optional(),
  license: z.string().optional(),
  dependencies: z.record(z.string()).optional(),
  devDependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
});

export type PackageJson = z.infer<typeof PackageJsonSchema>;

/**
 * Resolve an export value to a string.
 * Prefers "development" condition, falls back to "default", then string value.
 */
function resolveExportValue(
  value: string | z.infer<typeof ExportConditionsSchema>,
): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  return value.development ?? value.default;
}

/**
 * Normalize Node exports to Record<string, string>.
 * Uses "development" condition when available.
 */
function normalizeExports(
  exports: PackageJson["exports"],
): Record<string, string> {
  if (exports === undefined) {
    return { ".": "./src/index.ts" };
  }

  if (typeof exports === "string") {
    return { ".": exports };
  }

  // Check if it's a conditional export object (has development/default keys)
  if ("development" in exports || "default" in exports) {
    const resolved = resolveExportValue(
      exports as z.infer<typeof ExportConditionsSchema>,
    );
    return resolved ? { ".": resolved } : { ".": "./src/index.ts" };
  }

  // It's a record of entrypoints
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(exports)) {
    const resolved = resolveExportValue(value);
    if (resolved) {
      result[key] = resolved;
    }
  }

  return Object.keys(result).length > 0 ? result : { ".": "./src/index.ts" };
}

/**
 * Build imports map from dependencies.
 * Converts npm package names to jsr: specifiers where possible,
 * or keeps npm: specifiers for npm-only packages.
 */
function buildImports(packageJson: PackageJson): Record<string, string> {
  const imports: Record<string, string> = {};

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
  };

  for (const [name, version] of Object.entries(allDeps)) {
    // For now, use npm: specifiers with the version
    // In the future, we could map known packages to jsr:
    imports[name] = `npm:${name}@${version}`;
  }

  return imports;
}

/**
 * Parse scope from package name (e.g., "@effectionx/process" -> "effectionx")
 */
function parseScope(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const match = name.match(/@([^/]+)\//);
  return match ? match[1] : undefined;
}

/**
 * Create a Package for a Node/PNPM project.
 *
 * @param path - Local file path to the package directory
 * @param workspaceName - Directory name within the workspace (e.g., "process")
 * @param workspacePath - Relative path from monorepo root (e.g., "packages/process")
 * @param ref - Git ref information for GitHub links
 */
export function createNodePackage(
  path: string,
  workspaceName: string,
  workspacePath: string,
  ref: Ref,
): Package {
  const manifestUrl = new URL(`${path}/package.json`, "file://");

  // We'll compute these lazily from the manifest
  let cachedName: string | undefined;

  const pkg: Package = {
    manifestUrl,
    path,
    workspaceName,
    workspacePath,
    ref,
    deno: false,
    node: true,
    registries,

    // Registry URLs - will use the cached name once loaded
    get npm() {
      const name = cachedName ?? `@effectionx/${workspaceName}`;
      return new URL(`./${name}`, "https://www.npmjs.com/package/");
    },
    get npmVersionBadge() {
      const name = cachedName ?? `@effectionx/${workspaceName}`;
      return new URL(`./${name}`, "https://img.shields.io/npm/v/");
    },

    *getManifest(): Operation<PackageManifest> {
      const content = yield* until(Deno.readTextFile(`${path}/package.json`));
      const packageJson = PackageJsonSchema.parse(JSON.parse(content));

      // Cache the name for URL getters
      if (packageJson.name) {
        cachedName = packageJson.name;
      }

      return {
        name: packageJson.name,
        version: packageJson.version,
        exports: normalizeExports(packageJson.exports),
        license: packageJson.license,
        imports: buildImports(packageJson),
      };
    },

    *getName(): Operation<string> {
      const manifest = yield* this.getManifest();
      return manifest.name ?? workspaceName;
    },

    *getVersion(): Operation<string> {
      const manifest = yield* this.getManifest();
      return manifest.version ?? "0.0.0";
    },

    *getScopeName(): Operation<string | undefined> {
      const manifest = yield* this.getManifest();
      return parseScope(manifest.name);
    },

    *getExports(): Operation<Record<string, string>> {
      const manifest = yield* this.getManifest();
      return manifest.exports;
    },

    *getImports(): Operation<Record<string, string>> {
      const manifest = yield* this.getManifest();
      return manifest.imports;
    },

    *getEntrypoints(): Operation<Record<string, URL>> {
      const manifest = yield* this.getManifest();
      const entrypoints: Record<string, URL> = {};
      for (const [key, value] of Object.entries(manifest.exports)) {
        entrypoints[key] = new URL(value, `file://${path}/`);
      }
      return entrypoints;
    },

    *getDocs(): Operation<LocalDocsPages> {
      const entrypoints = yield* this.getEntrypoints();
      const imports = yield* this.getImports();

      const docs: LocalDocsPages = {};

      for (const [entrypoint, url] of Object.entries(entrypoints)) {
        const pages = yield* useDocPages(`${url}`, imports);

        docs[entrypoint] = pages[`${url}`].map((page) => ({
          ...page,
          sections: page.sections.map((section) => ({
            ...section,
            node: {
              ...section.node,
              location: {
                ...section.node.location,
                url: new URL(
                  `${relative(path, fileURLToPath(section.node.location.filename))}#L${section.node.location.line}`,
                  `${ref.url}/`,
                ),
              },
            },
          })),
        }));
      }

      return docs;
    },

    *getReadme(): Operation<string> {
      return yield* until(Deno.readTextFile(`${path}/README.md`));
    },

    *getMDXContent(): Operation<JSX.Element> {
      const readme = yield* this.getReadme();
      const mod = yield* useMDX(readme);
      return mod.default({});
    },

    *getTitle(): Operation<string> {
      const readme = yield* this.getReadme();
      return yield* useTitle(readme);
    },

    *getDescription(): Operation<string> {
      const readme = yield* this.getReadme();
      return yield* useDescription(readme);
    },
  };

  return pkg;
}
