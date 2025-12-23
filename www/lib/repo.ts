import type { Operation } from "effection";
import { $ } from "../context/shell.ts";
import { findLatestSemverTag } from "./semver.ts";

export interface Repo {
  name: string;
  owner: string;
  tags(matching: RegExp): Operation<Ref[]>;
  latest(matching: RegExp): Operation<Ref>;
}

export interface Ref {
  name: string;
  nameWithOwner: string;
  url: string;
}

export interface RepoOptions {
  name: string;
  owner: string;
}
export function createRepo(options: RepoOptions): Repo {
  let { name, owner } = options;
  let repo: Repo = {
    name,
    owner,
    *tags(matching) {
      let result = yield* $(`git tag`);
      let names = result.stdout.trim().split(/\s+/).filter((tag) =>
        matching.test(tag)
      );
      return names.map((tagname) => ({
        name: tagname,
        nameWithOwner: `${owner}/${name}`,
        url: `https://github.com/${owner}/${name}/tree/${tagname}`,
      }));
    },
    *latest(matching) {
      let tags = yield* repo.tags(matching);
      let latest = findLatestSemverTag(tags);

      if (!latest) {
        throw new Error(`Could not retrieve latest tag matching ${matching}`);
      }

      return tags.find((tag) => tag.name === latest.name)!;
    },
  };
  return repo;
}
