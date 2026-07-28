import {
  createContext,
  type Operation,
  type Scope,
  type Task,
  useScope,
} from "effection";
import { $ } from "../context/shell.ts";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

interface Clones {
  basepath: string;
  scope: Scope;
  checkouts: Map<string, Task<string>>;
}

const ClonesContext = createContext<Clones>("clones");

export function* initClones(path: string): Operation<void> {
  yield* $(`rm -rf ${path}`);
  yield* $(`mkdir -p ${path}`);
  let scope = yield* useScope();
  yield* ClonesContext.set({ basepath: path, scope, checkouts: new Map() });
}

/**
 * Resolve a local checkout of `nameWithOwner`, cloning it on first use and
 * refreshing it to `origin/main`.
 *
 * The checkout is a single working tree shared by every request, and
 * `git fetch` / `reset --hard` mutate it — running them concurrently corrupts
 * the tree (index-lock contention, half-applied resets), which surfaces as
 * intermittent 500s when a wide crawl hits many `/x` and `/contrib` pages at
 * once. So the work is memoized per repository on the root scope: the first
 * caller runs the git commands and every concurrent or later caller awaits that
 * same task, so each repository is fetched and reset exactly once.
 */
export function* useClone(nameWithOwner: string): Operation<string> {
  let clones = yield* ClonesContext.expect();

  let checkout = clones.checkouts.get(nameWithOwner);
  if (!checkout) {
    checkout = clones.scope.run(() =>
      cloneOrRefresh(clones.basepath, nameWithOwner)
    );
    clones.checkouts.set(nameWithOwner, checkout);
  }
  return yield* checkout;
}

function* cloneOrRefresh(
  basepath: string,
  nameWithOwner: string,
): Operation<string> {
  let dirpath = resolve(`${basepath}/${nameWithOwner}`);
  if (!existsSync(dirpath)) {
    yield* $(`git clone https://github.com/${nameWithOwner} ${dirpath}`);
  } else {
    yield* $(`git -C ${dirpath} fetch origin`);
    yield* $(`git -C ${dirpath} reset --hard origin/main`);
  }
  return dirpath;
}
