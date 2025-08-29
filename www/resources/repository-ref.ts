import { all, Operation, until } from "effection";

import { DenoJson, DenoJsonType, loadPackage, Package } from "./package.ts";
import { type ContentProvider, loadJson, Repository } from "./repository.ts";
import { OctokitContext } from "../context/github.ts";

export const REF_PATTERN = /^(\/?refs\/)?(heads|tags)\/(.*)$/;

/**
 * Return relative path that can be used to retrieve file content
 * @param base - Base path
 * @param target - Target path
 * @returns Combined path with leading "./" removed
 */
export function getPath(base: string, target: string): string {
  return [base, target].filter(Boolean).join("/").replace(/^\.\//, "");
}

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
 * Load a package at given workspace path from a repository ref
 * @param ref - Repository reference
 * @param workspacePath - Path to the workspace
 * @returns Package at the workspace path
 */
export function* loadWorkspace(
  ref: RepositoryRef,
  workspacePath: string,
): Operation<Package> {
  const { workspace } = yield* loadDenoJson(ref);
  if (!workspace?.includes(workspacePath)) {
    throw new Error(`${workspacePath} is not a valid workspace`);
  }

  return yield* loadPackage({ workspacePath, ref });
}

/**
 * Load all packages declared in workspaces from a repository ref
 * @param ref - Repository reference
 * @returns Array of packages from all workspaces
 */
export function* loadWorkspaces(ref: RepositoryRef): Operation<Package[]> {
  const { workspace = [] } = yield* loadDenoJson(ref);

  return yield* all(
    workspace.map((workspacePath) => loadWorkspace(ref, workspacePath)),
  );
}

/**
 * Load package located at the root of the repository ref
 * @param ref - Repository reference
 * @returns Package at the root, or undefined if it doesn't exist
 */
export function loadRootPackage(ref: RepositoryRef): Operation<Package> {
  return loadPackage({ workspacePath: "", ref });
}

export interface RepositoryRef extends ContentProvider {
  repository: Repository;

  /**
   * Name of the ref without heads/ or tags/ prefix
   */
  name: string;

  type: "branch" | "tag";

  /**
   * Ref in format heads/<name> for a branch and tags/<name> for a tag
   */
  ref: string;

  /**
   * Github web app url
   */
  url: string;

  /**
   * Get contents of a file at the specified path
   * @param path - Path to the file
   */
  getContent(path: string): Operation<string>;

  /**
   * Return complete URL of a file or a directory in GitHub API
   * @param base
   * @param target
   */
  getUrl(base?: string, target?: string, isFile?: boolean): URL;
}

export function* loadRepositoryRef({
  ref: _ref,
  repository,
}: {
  ref: string;
  repository: Repository;
}) {
  const github = yield* OctokitContext.expect();

  const ref = matchRef(_ref);

  if (!ref) throw new Error(`Could not normalize ${_ref}`);

  const url = getRefUrl(repository, ref);

  const repositoryRef: RepositoryRef = {
    repository,
    ...ref,
    url,

    getUrl(base, target, isFile) {
      return new URL(
        [isFile ? "blob" : "tree", ref.name, getPath(base ?? "", target ?? "")]
          .filter(Boolean)
          .join("/"),
        `https://github.com/${repository.nameWithOwner}/`,
      );
    },

    *getContent(path: string) {
      const response = yield* until(
        github.rest.repos.getContent({
          repo: repository.name,
          owner: repository.owner,
          path,
          ref: ref.name,
          mediaType: {
            format: "raw",
          },
        }),
      );

      return response.data.toString();
    },
  };

  return repositoryRef;
}

interface BranchRef {
  name: string;
  ref: string;
  type: "branch";
}

interface TagRef {
  name: string;
  ref: string;
  type: "tag";
}

export function matchRef(ref: string): BranchRef | TagRef | undefined {
  const parts = ref.match(REF_PATTERN);
  if (parts) {
    const [, , group, name] = parts;
    if (group === "heads") {
      return {
        type: "branch",
        name,
        ref: `${group}/${name}`,
      };
    } else if (group === "tags") {
      return {
        type: "tag",
        name,
        ref: `${group}/${name}`,
      };
    }
  }
}

export function getRefUrl(repository: Repository, ref: BranchRef | TagRef) {
  return `https://github.com/${repository.owner}/${repository.name}/tree/${ref.name}/`;
}
