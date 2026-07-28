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

  // `git fetch` / `reset --hard` mutate a single working tree shared by every
  // request, so running them concurrently corrupts it (index-lock contention,
  // half-applied resets) — which surfaces as intermittent 500s when a wide
  // crawl hits many `/x` and `/contrib` pages at once. Memoize the checkout per
  // repository on the root scope so each is fetched and reset exactly once, with
  // concurrent callers awaiting the same task.
  //
  // `cloneOrRefresh` returns an outcome rather than throwing: a task that throws
  // would tear down the shared scope and take every other checkout — and the
  // server — down with it. On failure we surface the error to the caller and
  // drop the entry so a later request can retry.
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
