import { call, type Operation, resource } from "effection";
import { globToRegExp } from "jsr:@std/path@1.0.6";
import { Endpoints, RequestParameters } from "npm:@octokit/types@13.6.2";
// @deno-types="npm:@types/semver@7.5.8"
import { rsort } from "npm:semver@7.6.3";

import { GithubClientContext } from "../context/github.ts";
import { DenoJson, DenoJsonType } from "../hooks/use-package.tsx";

export interface RepositoryRef {
  /**
   * Get readme file at the root of the ref
   * 
   * @return string
   */
  getReadme(): Operation<string>;

  /**
   * Get the parsed version of deno.json at the root
   */
  getDenoJson(): Operation<DenoJsonType>;
}

export interface Repository {
  get(): Operation<
    Endpoints["GET /repos/{owner}/{repo}"]["response"]["data"]
  >;

  /**
   * Retrieve tags for the current repository.
   *
   * Optionally, filter tags using a glob. It should accept the same arguement as we use to trigger a push event.
   *
   * For example:
   *  - v*
   *  - v3*
   *  - effection-v3*
   *
   * Should are valid glob patterns
   *
   * @returns tag objects
   */
  tags(
    glob?: string,
  ): Operation<
    Endpoints["GET /repos/{owner}/{repo}/tags"]["response"]["data"]
  >;

  /**
   * Find the latest Semver tag that matches a specific pattern.
   *
   * @param glob
   * @returns a tag if found or undefined
   */
  getLatestSemverTag(glob: string): unknown

  /**
   * Get contents of a repository
   *
   * @param params.path path to the content
   * @param params.ref optional branch, tag or commit (defaults to default branch when emitted)
   * @returns
   */
  getContent(
      params:
        & Omit<
          Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["parameters"],
          "owner" | "repo"
        >
        & RequestParameters,
    ): Operation<
      Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"]
    >

  loadRef(ref?: string | undefined): Operation<RepositoryRef>
}

export function loadRepository(
  { owner, name }: { owner: string; name: string },
) {
  return resource<Repository>(function* (provide) {
    let refs: Map<string, RepositoryRef> = new Map();
    const github = yield* GithubClientContext;

    const repository: Repository = {
      *get() {
        const github = yield* GithubClientContext;

        const result = yield* call(() =>
          github.rest.repos.get({
            repo: name,
            owner: owner,
          })
        );

        return result.data;
      },
      *tags(
        glob?: string,
      ) {
        const result = yield* call(() =>
          github.paginate(github.rest.repos.listTags, {
            repo: name,
            owner: owner,
          })
        );
    
        if (glob) {
          const regex = globToRegExp(glob);
    
          return result.filter((tag) => regex.test(tag.name));
        }
    
        return result;
      },
      *getLatestSemverTag(glob: string) {
        const tags = yield* this.tags(glob);
    
        const [latest] = rsort(tags.map((tag) => tag.name));
    
        return tags.find((tag) => tag.name === latest);
      },
      *getContent(
        params:
          & Omit<
            Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["parameters"],
            "owner" | "repo"
          >
          & RequestParameters,
      ): Operation<
        Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"]
      > {
        const response = yield* call(() =>
          github.rest.repos.getContent({
            repo: name,
            owner: owner,
            ...params,
          })
        );
    
        return response;
      },
      *loadRef(ref?: string | undefined): Operation<RepositoryRef> {
        if (ref === undefined) {
          const repository = yield* this.get();
          ref = repository.default_branch;
        }
        if (!refs.has(ref)) {
          refs.set(ref, yield* loadRepositoryRef({ ref, repository }));
        }
        return refs.get(ref)!;
      }
    };

    yield* provide(repository);
  });
}

function loadRepositoryRef({ ref, repository }: { ref: string; repository: Repository }) {
  return resource<RepositoryRef>(function*(provide) {
    let readme: string;
    let denoJson: DenoJsonType;

    const repositoryRef: RepositoryRef = {
      *getReadme() {
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

      *getDenoJson() {
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
  })
}