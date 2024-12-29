import { createContext } from "effection";

export interface RepositoryParams {
  name: string;
  location: URL;
  defaultBranch: string;
}

export type Repository = RepositoryParams & {
  url: URL;
  defaultBranchUrl: URL;
};

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
