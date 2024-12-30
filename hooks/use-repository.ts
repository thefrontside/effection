import { call, createContext, type Operation } from "effection";
import { Octokit } from "npm:octokit@^4.0.0";
import { Endpoints, RequestParameters } from "npm:@octokit/types@13.6.2";
import { globToRegExp } from "jsr:@std/path@1.0.6";
// @deno-types="npm:@types/semver@7.5.8"
import { rsort } from "npm:semver@7.6.3";
import { DenoJson } from "./use-package.tsx";

export const GithubClientContext = createContext<Octokit>("github-client");

export interface RepositoryParams {
  name: string;
  location: URL;
  defaultBranch: string;
}

class Repository {
  private refs: Map<string, RepositoryRef> = new Map();

  constructor(public owner: string, public name: string) {}

  *get(): Operation<
    Endpoints["GET /repos/{owner}/{repo}"]["response"]["data"]
  > {
    const github = yield* GithubClientContext;

    const result = yield* call(() =>
      github.rest.repos.get({
        repo: this.name,
        owner: this.owner,
      })
    );

    return result.data;
  }

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
  *tags(
    glob?: string,
  ): Operation<
    Endpoints["GET /repos/{owner}/{repo}/tags"]["response"]["data"]
  > {
    const github = yield* GithubClientContext;

    const result = yield* call(() =>
      github.paginate(github.rest.repos.listTags, {
        repo: this.name,
        owner: this.owner,
      })
    );

    if (glob) {
      const regex = globToRegExp(glob);

      return result.filter((tag) => regex.test(tag.name));
    }

    return result;
  }

  /**
   * Find the latest Semver tag that matches a specific pattern.
   *
   * @param glob
   * @returns a tag if found or undefined
   */
  *getLatestSemverTag(glob: string) {
    const tags = yield* this.tags(glob);

    const [latest] = rsort(tags.map((tag) => tag.name));

    return tags.find((tag) => tag.name === latest);
  }

  /**
   * Get contents of a repository
   *
   * @param params.path path to the content
   * @param params.ref optional branch, tag or commit (defaults to default branch when emitted)
   * @returns
   */
  *getContent(
    params: Omit<Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["parameters"],
      "owner" | "repo"
    > & RequestParameters,
  ): Operation<
    Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"]
  > {
    const github = yield* GithubClientContext;

    const response = yield* call(() =>
      github.rest.repos.getContent({
        repo: this.name,
        owner: this.owner,
        ...params,
      })
    );

    return response;
  }

  *ref(ref?: string | undefined): Operation<RepositoryRef> {
    if (ref === undefined) {
      const repository = yield* this.get();
      ref = repository.default_branch;
    }
    if (!this.refs.has(ref)) {
      this.refs.set(ref, new RepositoryRef(ref, this));
    }
    return this.refs.get(ref)!;
  }
}

class RepositoryRef {
  constructor(public ref: string, private repository: Repository) {}

  *getReadme() {
    const response = yield* this.repository.getContent({
      path: "README.md",
      ref: this.ref,
      mediaType: {
        format: "raw"
      }
    });

    return response.data.toString();
  }

  *getDenoJson() {
    const response = yield* this.repository.getContent({
      path: "deno.json",
      ref: this.ref,
      mediaType: {
        format: "raw"
      }
    });

    const text = response.data.toString();
    const denoJson = JSON.parse(text);
    
    return DenoJson.parse(denoJson);
  }
}

export const RepositoryContext = createContext<Repository>("repository");

export function* initRepositoryContext(
  { name, location, defaultBranch }: RepositoryParams,
) {
  const url = new URL(`./${name}/`, "https://github.com/");

  return yield* RepositoryContext.set({
    name,
    location,
    defaultBranch,
    url,
    defaultBranchUrl: new URL(`./tree/${defaultBranch}/`, url),
  });
}

export function* useRepository() {
  return yield* RepositoryContext;
}
