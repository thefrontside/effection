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
 * Zod schema for deno.json files.
 */
export const DenoJsonSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  exports: z.union([z.record(z.string()), z.string()]).optional(),
  license: z.string().optional(),
  workspace: z.array(z.string()).optional(),
  imports: z.record(z.string()).optional(),
});

export type DenoJson = z.infer<typeof DenoJsonSchema>;

/**
 * Normalize Deno exports to Record<string, string>.
 */
function normalizeExports(
  exports: DenoJson["exports"],
): Record<string, string> {
  if (typeof exports === "string") {
    return { ".": exports };
  }
  if (exports === undefined) {
    return { ".": "./mod.ts" };
  }
  return exports;
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
 * Create a Package for a Deno project.
 *
 * @param path - Local file path to the package directory
 * @param workspaceName - Directory name within the workspace (e.g., "process")
 * @param workspacePath - Relative path from monorepo root (e.g., "packages/process")
 * @param ref - Git ref information for GitHub links
 */
export function createDenoPackage(
  path: string,
  workspaceName: string,
  workspacePath: string,
  ref: Ref,
): Package {
  const manifestUrl = new URL(`${path}/deno.json`, "file://");

  // We'll compute these lazily from the manifest
  let cachedName: string | undefined;

  const pkg: Package = {
    manifestUrl,
    path,
    workspaceName,
    workspacePath,
    ref,
    deno: true,
    node: false,
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
      const content = yield* until(Deno.readTextFile(`${path}/deno.json`));
      const denoJson = DenoJsonSchema.parse(JSON.parse(content));

      // Cache the name for URL getters
      if (denoJson.name) {
        cachedName = denoJson.name;
      }

      return {
        name: denoJson.name,
        version: denoJson.version,
        exports: normalizeExports(denoJson.exports),
        license: denoJson.license,
        imports: denoJson.imports ?? {},
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
