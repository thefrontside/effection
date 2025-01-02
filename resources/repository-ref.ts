import { all, call, Operation, resource } from "effection";

import { DenoJson, DenoJsonType, loadPackage, Package } from "./package.ts";
import { Repository } from "./repository.ts";
import { GithubClientContext } from "../context/github.ts";
import { Endpoints } from "npm:@octokit/types@13.6.2";

export const REF_PATTERN = /^(\/?refs\/)?(heads|tags)\/(.*)$/;

type Ref =
  Endpoints["GET /repos/{owner}/{repo}/git/ref/{ref}"]["response"]["data"];

export interface RepositoryRef {
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
}

export function loadRepositoryRef(
  { ref: _ref, repository }: { ref: string; repository: Repository },
) {
  return resource<RepositoryRef>(function* (provide) {
    let denoJson: DenoJsonType;
    let packages: Map<string, Package> = new Map();
    let fetchedRef: Ref;
    const files: Map<string, string> = new Map();

    const ref = matchRef(_ref);

    if (!ref) throw new Error(`Could not normalize ${_ref}`);

    const url = getRefUrl(repository, ref);

    const repositoryRef: RepositoryRef = {
      ...ref,
      url,

      *get() {
        if (!fetchedRef) {
          const github = yield* GithubClientContext.expect();

          const response = yield* call(() =>
            github.rest.git.getRef({
              owner: repository.owner,
              name: repository.name,
              ref: ref.ref,
            })
          );
          
          fetchedRef = response.data
        }

        return fetchedRef;
      },

      *loadReadme(base: string = "") {
        const path = [base, "README.md"].filter(Boolean).join("/").replace(
          /^\.\//,
          "",
        );

        if (!files.has(path)) {
          const response = yield* repository.getContent({
            path,
            ref: ref.name,
            mediaType: {
              format: "raw",
            },
          });
  
          files.set(path, response.data.toString());
        }

        return files.get(path)!;
      },

      *loadDenoJson(base: string = "") {
        const path = [base, "deno.json"].filter(Boolean).join("/").replace(
          /^\.\//,
          "",
        );

        if (!files.has(path)) {
          const response = yield* repository.getContent({
            path: path,
            ref: ref.name,
            mediaType: {
              format: "raw",
            },
          });
  
          files.set(path, response.data.toString());
        }

        const text = files.get(path)!;

        const json = JSON.parse(text);

        denoJson = DenoJson.parse(json);

        return denoJson;
      },

      *loadRootPackage() {
        if (packages.has("")) {
          return packages.get("");
        }
        const pkg = yield* loadPackage(
          { workspacePath: "", ref: repositoryRef },
        );
        packages.set("", pkg);
        return pkg;
      },

      *loadWorkspace(workspacePath: string) {
        const { workspace } = yield* repositoryRef.loadDenoJson();
        if (!workspace?.includes(workspacePath)) {
          throw new Error(`${workspacePath} is not a valid workspace`);
        }
        if (packages.has(workspacePath)) {
          return packages.get(workspacePath)!;
        }
        const pkg = yield* loadPackage({ workspacePath, ref: repositoryRef });
        packages.set(workspacePath, pkg);
        return pkg;
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
