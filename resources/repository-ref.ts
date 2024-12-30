import { all, Operation, resource } from "effection";

import { DenoJson, DenoJsonType, loadPackage, Package } from "./package.ts";
import { Repository } from "./repository.ts";

export interface RepositoryRef {
  /**
   * Name of the ref
   */
  name: string;
  /**
   * Get readme file at the root of the ref
   *
   * @return string
   */
  loadReadme(): Operation<string>;

  /**
   * Get the parsed version of deno.json at the root
   */
  loadDenoJson(): Operation<DenoJsonType>;

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
  { ref, repository }: { ref: string; repository: Repository },
) {
  return resource<RepositoryRef>(function* (provide) {
    let readme: string;
    let denoJson: DenoJsonType;
    let packages: Map<string, Package>;

    const repositoryRef: RepositoryRef = {
      name: ref,
      *loadReadme() {
        if (readme) {
          return readme;
        }

        const response = yield* repository.getContent({
          path: "README.md",
          ref,
          mediaType: {
            format: "raw",
          },
        });

        return readme = response.data.toString();
      },

      *loadDenoJson() {
        if (denoJson) {
          return denoJson;
        }

        const response = yield* repository.getContent({
          path: "deno.json",
          ref,
          mediaType: {
            format: "raw",
          },
        });

        const text = response.data.toString();

        const json = JSON.parse(text);

        denoJson = DenoJson.parse(json);

        return denoJson;
      },

      *loadRootPackage() {
        if (packages.has("")) {
          return packages.get("")
        }
        const pkg = yield* loadPackage(({ workspacePath: "", ref: repositoryRef }));
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
        if (packages) {
          return yield* all(
            workspace.map((workspacePath) =>
              repositoryRef.loadWorkspace(workspacePath)
            ),
          );
        }
        return [];
      },
    };

    yield* provide(repositoryRef);
  });
}
