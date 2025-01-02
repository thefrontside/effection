import { all, call, Operation, resource } from "effection";

import { Endpoints } from "npm:@octokit/types@13.6.2";
import { GithubClientContext } from "../context/github.ts";
import { DenoJson, DenoJsonType, loadPackage, Package } from "./package.ts";
import { Repository } from "./repository.ts";

export const REF_PATTERN = /^(\/?refs\/)?(heads|tags)\/(.*)$/;

type Ref =
  Endpoints["GET /repos/{owner}/{repo}/git/ref/{ref}"]["response"]["data"];

export interface RepositoryRef {
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
   * Retrieve tag information
   */
  get(): Operation<Ref>;

  /**
   * Get readme file at the root of the ref
   *
   * @return string
   */
  loadReadme(base?: string): Operation<string>;

  /**
   * Get the parsed version of deno.json at the root
   */
  loadDenoJson(base?: string): Operation<DenoJsonType>;

  /**
   * Load a package at given workspace path
   */
  loadWorkspace(workspacePath: string): Operation<Package>;

  /**
   * Load package located at the root of the ref
   */
  loadRootPackage(): Operation<Package | undefined>;

  /**
   * Load packages declarated in workspaces
   */
  loadWorkspaces(): Operation<Package[]>;

  /**
   * Return relative path that can be to retrieve file content
   * @param base
   * @param target
   */
  getPath(base: string, target: string): string;

  /**
   * Return complete URL of a file or a directory in GitHub API
   * @param base
   * @param target
   */
  getUrl(base: string, target: string, isFile: boolean): URL;
}

export function loadRepositoryRef(
  { ref: _ref, repository }: { ref: string; repository: Repository },
) {
  return resource<RepositoryRef>(function* (provide) {
    const ref = matchRef(_ref);

    if (!ref) throw new Error(`Could not normalize ${_ref}`);

    const url = getRefUrl(repository, ref);

    const repositoryRef: RepositoryRef = {
      repository,
      ...ref,
      url,

      getUrl(base, target, isFile) {
        return new URL(
          `./${isFile ? "blob" : "tree"}/${ref.name}/${
            repositoryRef.getPath(base, target)
          }`,
          `https://github.com/${repository.owner}/${repository.name}/`,
        );
      },

      getPath(base, target) {
        return [base, target].filter(Boolean).join("/").replace(
          /^\.\//,
          "",
        );
      },

      *get() {
        const github = yield* GithubClientContext.expect();

        const response = yield* call(() =>
          github.rest.git.getRef({
            owner: repository.owner,
            name: repository.name,
            ref: ref.ref,
          })
        );

        return response.data;
      },

      *loadReadme(base: string = "") {
        const path = repositoryRef.getPath(base, "README.md");

        const response = yield* repository.getContent({
          path,
          ref: ref.name,
          mediaType: {
            format: "raw",
          },
        });

        return response.data.toString()
      },

      *loadDenoJson(base: string = "") {
        const path = repositoryRef.getPath(base, "deno.json");

        const response = yield* repository.getContent({
          path: path,
          ref: ref.name,
          mediaType: {
            format: "raw",
          },
        });

        const text = response.data.toString();

        const json = JSON.parse(text);

        return DenoJson.parse(json);
      },

      *loadRootPackage() {
        return yield* loadPackage(
          { workspacePath: "", ref: repositoryRef },
        );
      },

      *loadWorkspace(workspacePath: string) {
        const { workspace } = yield* repositoryRef.loadDenoJson();
        if (!workspace?.includes(workspacePath)) {
          throw new Error(`${workspacePath} is not a valid workspace`);
        }

        return yield* loadPackage({ workspacePath, ref: repositoryRef });
      },

      *loadWorkspaces() {
        const { workspace = [] } = yield* repositoryRef.loadDenoJson();

        return yield* all(
          workspace.map((workspacePath) =>
            repositoryRef.loadWorkspace(workspacePath)
          ),
        );
      },
    };

    yield* provide(repositoryRef);
  });
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

function getRefUrl(repository: Repository, ref: BranchRef | TagRef) {
  return `https://github.com/${repository.owner}/${repository.name}/tree/${ref.name}/}`;
}
