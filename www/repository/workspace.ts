import { all, type Operation } from "effection";
import {
  DenoJson,
  DenoJsonType,
  loadPackage,
  Package,
} from "../resources/package.ts";
import type { ContentProvider, RepositoryRef } from "./types.ts";
import { getPath, loadJson } from "./utils.ts";

/**
 * Load and parse deno.json from a content provider
 * @param contentProvider - Object that can provide file content
 * @param base - Base path (defaults to "")
 * @returns Parsed deno.json content
 */
export function* loadDenoJson(
  contentProvider: ContentProvider,
  base: string = "",
): Operation<DenoJsonType> {
  const path = getPath(base, "deno.json");
  const json = yield* loadJson(contentProvider, path);
  return DenoJson.parse(json);
}

/**
 * Load all packages declared in workspaces from a repository ref
 * @param ref - Repository reference
 * @returns Array of packages from all workspaces
 */
export function* loadWorkspaces(ref: RepositoryRef): Operation<Package[]> {
  const { workspace = [] } = yield* loadDenoJson(ref);
  return yield* all(
    workspace.map((workspacePath) => loadPackage({ ref, workspacePath })),
  );
}

/**
 * Load package located at the root of the repository ref
 * @param ref - Repository reference
 * @returns Package at the root
 */
export function loadRootPackage(ref: RepositoryRef): Operation<Package> {
  return loadPackage({ workspacePath: "", ref });
}
