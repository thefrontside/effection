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

export function* initClones(path: string): Operation<void> {
  yield* $(`rm -rf ${path}`);
  yield* $(`mkdir -p ${path}`);

  let scope = yield* useScope();
  let attempts = new Map<string, Task<Result<string>>>();

  // Concurrent `git fetch` / `reset --hard` on the shared working tree corrupt
  // it (index-lock contention, half-applied resets), so each repo is fetched
  // exactly once. A `scope.run` task that throws would tear down this shared
  // scope and every other checkout with it, so failures come back as a Result
  // and the entry is evicted to allow a retry.
  yield* Clones.set((nameWithOwner) => ({
    *[Symbol.iterator]() {
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
    },
  }));
}

export function* useClone(nameWithOwner: string): Operation<string> {
  let checkout = yield* Clones.expect();
  return yield* checkout(nameWithOwner);
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
