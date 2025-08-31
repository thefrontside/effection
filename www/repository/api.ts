import { createApi } from "../context/context-api.ts";
import type { Repositories } from "./types.ts";
import {
  createOctokitRepository,
  createOctokitRepositoryRef,
} from "./octokit-provider.ts";
import { createGitRepository, createGitRepositoryRef } from "./git-provider.ts";
import { processApi } from "../context/process.ts";

/**
 * Default repository API that requires a provider to be installed via middleware
 */
export const repositoriesApi = createApi<Repositories>("repositories", {
  useRepository() {
    throw new Error(
      "No repository provider installed. Use initOctokitRepositoryProvider() or initGitRepositoryProvider() to install a provider.",
    );
  },

  useRef() {
    throw new Error(
      "No repository provider installed. Use initOctokitRepositoryProvider() or initGitRepositoryProvider() to install a provider.",
    );
  },
});

/**
 * Repository operations from the API
 */
export const { useRepository, useRef } = repositoriesApi.operations;

/**
 * Initialize Octokit repository provider middleware
 * This will override the default repository operations with Octokit-based implementations
 */
export function* initOctokitRepositoryProvider() {
  yield* repositoriesApi.around({
    *useRepository([{ owner, name }]) {
      return yield* createOctokitRepository({ owner, name });
    },

    *useRef([{ repository, ref }]) {
      return yield* createOctokitRepositoryRef({ repository, ref });
    },
  });
}

/**
 * Initialize Git repository provider middleware
 * This will override the default repository operations with Git-based implementations
 */
export function* initGitRepositoryProvider() {
  yield* repositoriesApi.around({
    *useRepository([{ owner, name }]) {
      return yield* createGitRepository({ owner, name });
    },

    *useRef([{ repository, ref }]) {
      return yield* createGitRepositoryRef({ repository, ref });
    },
  });
}
