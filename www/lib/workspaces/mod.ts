import { existsSync } from "node:fs";
import { resolve } from "@std/path";
import { parse as parseYaml } from "@std/yaml";
import type { Operation } from "effection";
import { until } from "effection";
import z from "zod";

import { useClone } from "../clones.ts";
import { createNodePackage } from "../package/node.ts";
import type { Package, Ref } from "../package/types.ts";
import type { Workspaces } from "./types.ts";

export type { Workspaces } from "./types.ts";

/**
 * Schema for pnpm-workspace.yaml files.
 */
const PnpmWorkspaceSchema = z.object({
  packages: z.array(z.string()),
});

/**
 * Check if a path represents a hidden/internal package that should be excluded.
 * Hidden packages start with "." (e.g., ".internal")
 */
function isHiddenPackage(pathOrName: string): boolean {
  let name = pathOrName.split("/").pop() ?? pathOrName;
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
  let dirs: string[] = [];

  for (let pattern of patterns) {
    // Skip hidden/internal package patterns
    if (isHiddenPackage(pattern)) {
      continue;
    }

    if (pattern.endsWith("/*")) {
      // Simple glob: packages/* -> list directories in packages/
      let basePath = pattern.slice(0, -2);
      let fullPath = resolve(rootPath, basePath);

      try {
        for (let entry of Deno.readDirSync(fullPath)) {
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
 * Get workspace patterns from a Node/PNPM monorepo.
 */
function* getWorkspacePatterns(rootPath: string): Operation<string[]> {
  let content = yield* until(
    Deno.readTextFile(`${rootPath}/pnpm-workspace.yaml`),
  );
  let parsed = parseYaml(content);
  let workspace = PnpmWorkspaceSchema.parse(parsed);
  return workspace.packages;
}

/**
 * Create a Workspaces instance for a given repository.
 * Currently only supports PNPM monorepos.
 *
 * @param nameWithOwner - GitHub repo in "owner/repo" format
 */
export function* useWorkspaces(nameWithOwner: string): Operation<Workspaces> {
  let rootPath = yield* useClone(nameWithOwner);

  if (!existsSync(`${rootPath}/pnpm-workspace.yaml`)) {
    throw new Error(
      `Could not find pnpm-workspace.yaml for ${nameWithOwner}. ` +
        `Only PNPM monorepos are currently supported.`,
    );
  }

  let url = `https://github.com/${nameWithOwner}`;
  let refName = "main";

  // Get workspace patterns from pnpm-workspace.yaml
  let patterns = yield* getWorkspacePatterns(rootPath);

  // Expand patterns to actual directories
  let workspaceDirs = yield* expandPatterns(rootPath, patterns);

  // Create ref builder
  let createRef = (workspacePath: string): Ref => ({
    name: refName,
    nameWithOwner,
    url: `${url}/tree/${refName}/${workspacePath}`,
  });

  // Build lookup caches lazily
  let packagesByWorkspace: Map<string, Package> | undefined;
  let packagesByName: Map<string, Package> | undefined;

  function* ensureCaches(): Operation<void> {
    if (packagesByWorkspace && packagesByName) return;

    packagesByWorkspace = new Map();
    packagesByName = new Map();

    for (let workspacePath of workspaceDirs) {
      let fullPath = resolve(rootPath, workspacePath);
      let workspaceName = workspacePath.split("/").pop()!;
      let ref = createRef(workspacePath);

      let pkg = createNodePackage(fullPath, workspaceName, workspacePath, ref);
      packagesByWorkspace.set(workspaceName, pkg);

      // Get package name for the name lookup
      try {
        let manifest = yield* pkg.getManifest();
        if (manifest.name) {
          packagesByName.set(manifest.name, pkg);
        }
      } catch {
        // Package might not have a valid manifest, skip name lookup
      }
    }
  }

  let workspaces: Workspaces = {
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
