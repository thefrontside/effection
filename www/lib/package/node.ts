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
  useDescription,
  useTitle,
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
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
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
    let resolved = resolveExportValue(
      exports as z.infer<typeof ExportConditionsSchema>,
    );
    return resolved ? { ".": resolved } : { ".": "./src/index.ts" };
  }

  // It's a record of entrypoints
  let result: Record<string, string> = {};
  for (let [key, value] of Object.entries(exports)) {
    let resolved = resolveExportValue(value);
    if (resolved && isDocumentable(resolved)) {
      result[key] = resolved;
    }
  }

  return Object.keys(result).length > 0 ? result : { ".": "./src/index.ts" };
}

/**
 * Check if an export path points to a documentable source file.
 * Filters out binary artifacts like .wasm files that can't be parsed as TypeScript/JavaScript.
 */
function isDocumentable(path: string): boolean {
  return !path.endsWith(".wasm");
}

/**
 * Sanitize a semver version range for use in npm: specifiers.
 * Handles cases like "^3 || ^4" by taking the first valid part.
 */
function sanitizeVersion(version: string): string {
  // Handle OR ranges (e.g., "^3 || ^4") - take the first part
  if (version.includes("||")) {
    return version.split("||")[0].trim();
  }
  // Handle workspace protocol
  if (version.startsWith("workspace:")) {
    return "*";
  }
  return version;
}

/**
 * Build imports map from dependencies.
 * Converts npm package names to npm: specifiers.
 */
function buildImports(packageJson: PackageJson): Record<string, string> {
  let imports: Record<string, string> = {};

  let allDeps = {
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
  };

  for (let [name, version] of Object.entries(allDeps)) {
    let sanitizedVersion = sanitizeVersion(version);
    imports[name] = `npm:${name}@${sanitizedVersion}`;
  }

  return imports;
}

/**
 * Parse scope from package name (e.g., "@effectionx/process" -> "effectionx")
 */
function parseScope(name: string | undefined): string | undefined {
  if (!name) return undefined;
  let match = name.match(/@([^/]+)\//);
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
  let manifestUrl = new URL(`${path}/package.json`, "file://");

  // We'll compute these lazily from the manifest
  let cachedName: string | undefined;

  let pkg: Package = {
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
      let name = cachedName ?? `@effectionx/${workspaceName}`;
      return new URL(`./${name}`, "https://www.npmjs.com/package/");
    },
    get npmVersionBadge() {
      let name = cachedName ?? `@effectionx/${workspaceName}`;
      return new URL(`./${name}`, "https://img.shields.io/npm/v/");
    },

    *getManifest(): Operation<PackageManifest> {
      let content = yield* until(Deno.readTextFile(`${path}/package.json`));
      let packageJson = PackageJsonSchema.parse(JSON.parse(content));

      // Cache the name for URL getters
      if (packageJson.name) {
        cachedName = packageJson.name;
      }

      return {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        keywords: packageJson.keywords,
        exports: normalizeExports(packageJson.exports),
        license: packageJson.license,
        imports: buildImports(packageJson),
      };
    },

    *getName(): Operation<string> {
      let manifest = yield* this.getManifest();
      return manifest.name ?? workspaceName;
    },

    *getVersion(): Operation<string> {
      let manifest = yield* this.getManifest();
      return manifest.version ?? "0.0.0";
    },

    *getScopeName(): Operation<string | undefined> {
      let manifest = yield* this.getManifest();
      return parseScope(manifest.name);
    },

    *getExports(): Operation<Record<string, string>> {
      let manifest = yield* this.getManifest();
      return manifest.exports;
    },

    *getImports(): Operation<Record<string, string>> {
      let manifest = yield* this.getManifest();
      return manifest.imports;
    },

    *getEntrypoints(): Operation<Record<string, URL>> {
      let manifest = yield* this.getManifest();
      let entrypoints: Record<string, URL> = {};
      for (let [key, value] of Object.entries(manifest.exports)) {
        entrypoints[key] = new URL(value, `file://${path}/`);
      }
      return entrypoints;
    },

    *getDocs(): Operation<LocalDocsPages> {
      let entrypoints = yield* this.getEntrypoints();
      let imports = yield* this.getImports();

      let docs: LocalDocsPages = {};

      for (let [entrypoint, url] of Object.entries(entrypoints)) {
        let pages = yield* useDocPages(`${url}`, imports);

        docs[entrypoint] = pages[`${url}`].map((page) => ({
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
        }));
      }

      return docs;
    },

    *getReadme(): Operation<string> {
      return yield* until(Deno.readTextFile(`${path}/README.md`));
    },

    *getMDXContent(): Operation<JSX.Element> {
      let readme = yield* this.getReadme();
      let mod = yield* useMDX(readme);
      return mod.default({});
    },

    *getTitle(): Operation<string> {
      let readme = yield* this.getReadme();
      return yield* useTitle(readme);
    },

    *getDescription(): Operation<string> {
      // Prefer manifest description over README-inferred description
      let manifest = yield* this.getManifest();
      if (manifest.description) {
        return manifest.description;
      }
      // Fall back to README-inferred description
      let readme = yield* this.getReadme();
      return yield* useDescription(readme);
    },

    *getKeywords(): Operation<string[]> {
      let manifest = yield* this.getManifest();
      return manifest.keywords ?? [];
    },
  };

  return pkg;
}
