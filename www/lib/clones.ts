import {
  createContext,
  Err,
  Ok,
  type Operation,
  type Result,
  type Task,
  useScope,
} from "effection";
import { $ } from "../context/shell.ts";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

type Checkout = (nameWithOwner: string) => Operation<string>;

const Clones = createContext<Checkout>("clones");

export interface ClonesOptions {
  /**
   * Directories to use in place of a clone, keyed by `owner/repo`.
   *
   * A local checkout is used exactly as it is on disk. It is never fetched or
   * reset, both so that uncommitted work shows up on the site, and so that the
   * site never touches a checkout you are working in.
   */
  checkouts?: Record<string, string>;
}

export function* initClones(
  path: string,
  options: ClonesOptions = {},
): Operation<void> {
  // resolved before anything is removed, so that a bad path fails at startup
  // rather than on the first request that needs the repo
  let checkouts = resolveCheckouts(options.checkouts ?? {});
  for (let [nameWithOwner, dirpath] of Object.entries(checkouts)) {
    console.log(`${nameWithOwner} -> ${dirpath}`);
  }

  yield* $(`rm -rf ${path}`);
  yield* $(`mkdir -p ${path}`);

  let scope = yield* useScope();
  let attempts = new Map<string, Task<Result<string>>>();

  // Concurrent `git fetch` / `reset --hard` on the shared working tree corrupt
  // it (index-lock contention, half-applied resets), so each repo is fetched
  // exactly once. A `scope.run` task that throws would tear down this shared
  // scope and every other checkout with it, so failures come back as a Result
  // and the entry is evicted to allow a retry.
  yield* Clones.set(function* (nameWithOwner) {
    let checkout = checkouts[nameWithOwner];
    if (checkout) {
      return checkout;
    }

    let attempt = attempts.get(nameWithOwner);
    if (!attempt) {
      attempt = scope.run(() => cloneOrRefresh(path, nameWithOwner));
      attempts.set(nameWithOwner, attempt);
    }
    let outcome = yield* attempt;
    if (!outcome.ok) {
      attempts.delete(nameWithOwner);
      throw outcome.error;
    }
    return outcome.value;
  });
}

export function* useClone(nameWithOwner: string): Operation<string> {
  let checkout = yield* Clones.expect();
  return yield* checkout(nameWithOwner);
}

export function resolveCheckouts(
  checkouts: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(checkouts).map(([nameWithOwner, path]) => {
      let dirpath = resolve(path);
      if (!existsSync(dirpath)) {
        throw new Error(
          `cannot use ${dirpath} as a local checkout of ${nameWithOwner}: no such directory`,
        );
      }
      return [nameWithOwner, dirpath];
    }),
  );
}

function* cloneOrRefresh(
  basepath: string,
  nameWithOwner: string,
): Operation<Result<string>> {
  let dirpath = resolve(`${basepath}/${nameWithOwner}`);
  try {
    if (!existsSync(dirpath)) {
      yield* $(`git clone https://github.com/${nameWithOwner} ${dirpath}`);
    } else {
      yield* $(`git -C ${dirpath} fetch origin`);
      yield* $(`git -C ${dirpath} reset --hard origin/main`);
    }
    return Ok(dirpath);
  } catch (error) {
    return Err(error as Error);
  }
}
