import { Operation, resource } from "effection";

import { DenoJsonType, DenoJson } from "./package.ts";
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
}

export function loadRepositoryRef({ ref, repository }: { ref: string; repository: Repository; }) {
  return resource<RepositoryRef>(function* (provide) {
    let readme: string;
    let denoJson: DenoJsonType;

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

        denoJson = DenoJson.parse(JSON.parse(text));

        return denoJson;
      }
    };

    yield* provide(repositoryRef);
  });
}
