import type { Operation } from "effection";
import { until } from "effection";
import { resolve } from "@std/path";
import { parse as parseYaml } from "@std/yaml";
import z from "zod";
import { existsSync } from "node:fs";

import type { Workspaces } from "./types.ts";
import type { Package, Ref } from "../package/types.ts";
import { createDenoPackage, DenoJsonSchema } from "../package/deno.ts";
import { createNodePackage } from "../package/node.ts";
import { useClone } from "../clones.ts";

export type { Workspaces } from "./types.ts";

/**
 * Schema for pnpm-workspace.yaml files.
 */
const PnpmWorkspaceSchema = z.object({
  packages: z.array(z.string()),
});

/**
 * Detect workspace type by checking for deno.json or pnpm-workspace.yaml.
 */
function detectWorkspaceType(
  rootPath: string,
): "deno" | "node" | null {
  if (existsSync(`${rootPath}/deno.json`)) {
    return "deno";
  }
  if (existsSync(`${rootPath}/pnpm-workspace.yaml`)) {
    return "node";
  }
  return null;
}

/**
 * Check if a path represents a hidden/internal package that should be excluded.
 * Hidden packages start with "." (e.g., ".internal")
 */
function isHiddenPackage(pathOrName: string): boolean {
  const name = pathOrName.split("/").pop() ?? pathOrName;
  return name.startsWith(".");
}

/**
 * Expand glob patterns to actual directory paths.
 * Simple implementation that handles patterns like "packages/*".
 * Excludes hidden directories (starting with ".") as they are internal packages.
 */
function* expandPatterns(
  rootPath: string,
  patterns: string[],
): Operation<string[]> {
  const dirs: string[] = [];

  for (const pattern of patterns) {
    // Skip hidden/internal package patterns
    if (isHiddenPackage(pattern)) {
      continue;
    }

    if (pattern.endsWith("/*")) {
      // Simple glob: packages/* -> list directories in packages/
      const basePath = pattern.slice(0, -2);
      const fullPath = resolve(rootPath, basePath);

      try {
        for (const entry of Deno.readDirSync(fullPath)) {
          // Skip hidden directories (internal packages)
          if (entry.isDirectory && !entry.name.startsWith(".")) {
            dirs.push(`${basePath}/${entry.name}`);
          }
        }
      } catch {
        // Directory doesn't exist, skip
      }
    } else if (!pattern.includes("*")) {
      // Literal path - only include if not hidden
      dirs.push(pattern);
    } else {
      // Other glob patterns not supported yet
      console.warn(`Unsupported glob pattern: ${pattern}`);
    }
  }

  return dirs;
}

/**
 * Get workspace patterns from a Deno monorepo (from deno.json workspace field).
 */
function* getDenoPatterns(rootPath: string): Operation<string[]> {
  const content = yield* until(Deno.readTextFile(`${rootPath}/deno.json`));
  const denoJson = DenoJsonSchema.parse(JSON.parse(content));
  return denoJson.workspace ?? [];
}

/**
 * Get workspace patterns from a Node/PNPM monorepo.
 */
function* getNodePatterns(rootPath: string): Operation<string[]> {
  const content = yield* until(
    Deno.readTextFile(`${rootPath}/pnpm-workspace.yaml`),
  );
  const parsed = parseYaml(content);
  const workspace = PnpmWorkspaceSchema.parse(parsed);
  return workspace.packages;
}

/**
 * Create a Workspaces instance for a given repository.
 *
 * @param nameWithOwner - GitHub repo in "owner/repo" format
 */
export function* useWorkspaces(nameWithOwner: string): Operation<Workspaces> {
  const rootPath = yield* useClone(nameWithOwner);
  const type = detectWorkspaceType(rootPath);

  if (!type) {
    throw new Error(
      `Could not detect workspace type for ${nameWithOwner}. ` +
        `Expected deno.json or pnpm-workspace.yaml at root.`,
    );
  }

  const url = `https://github.com/${nameWithOwner}`;
  const refName = "main";

  // Get workspace patterns based on type
  const patterns =
    type === "deno"
      ? yield* getDenoPatterns(rootPath)
      : yield* getNodePatterns(rootPath);

  // Expand patterns to actual directories
  const workspaceDirs = yield* expandPatterns(rootPath, patterns);

  // Create ref builder
  const createRef = (workspacePath: string): Ref => ({
    name: refName,
    nameWithOwner,
    url: `${url}/tree/${refName}/${workspacePath}`,
  });

  // Create package factory based on type
  const createPackage =
    type === "deno"
      ? (path: string, name: string, workspacePath: string, ref: Ref) =>
          createDenoPackage(path, name, workspacePath, ref)
      : (path: string, name: string, workspacePath: string, ref: Ref) =>
          createNodePackage(path, name, workspacePath, ref);

  // Build lookup caches lazily
  let packagesByWorkspace: Map<string, Package> | undefined;
  let packagesByName: Map<string, Package> | undefined;

  function* ensureCaches(): Operation<void> {
    if (packagesByWorkspace && packagesByName) return;

    packagesByWorkspace = new Map();
    packagesByName = new Map();

    for (const workspacePath of workspaceDirs) {
      const fullPath = resolve(rootPath, workspacePath);
      const workspaceName = workspacePath.split("/").pop()!;
      const ref = createRef(workspacePath);

      const pkg = createPackage(fullPath, workspaceName, workspacePath, ref);
      packagesByWorkspace.set(workspaceName, pkg);

      // Get package name for the name lookup
      try {
        const manifest = yield* pkg.getManifest();
        if (manifest.name) {
          packagesByName.set(manifest.name, pkg);
        }
      } catch {
        // Package might not have a valid manifest, skip name lookup
      }
    }
  }

  const workspaces: Workspaces = {
    url,
    nameWithOwner,
    workspacePatterns: patterns,

    *getWorkspace(name: string): Operation<Package | undefined> {
      yield* ensureCaches();
      return packagesByWorkspace!.get(name);
    },

    *getPackage(name: string): Operation<Package | undefined> {
      yield* ensureCaches();
      return packagesByName!.get(name);
    },

    *listWorkspaces(): Operation<string[]> {
      yield* ensureCaches();
      return [...packagesByWorkspace!.keys()];
    },

    *listPackages(): Operation<string[]> {
      yield* ensureCaches();
      return [...packagesByName!.keys()];
    },

    *getAllPackages(): Operation<Package[]> {
      yield* ensureCaches();
      return [...packagesByWorkspace!.values()];
    },
  };

  return workspaces;
}
