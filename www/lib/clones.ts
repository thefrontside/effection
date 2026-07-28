import { createContext, type Operation, useScope } from "effection";
import { $ } from "../context/shell.ts";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

type Checkout = (nameWithOwner: string) => Operation<string>;

const Clones = createContext<Checkout>("clones");

export function* initClones(path: string): Operation<void> {
  yield* $(`rm -rf ${path}`);
  yield* $(`mkdir -p ${path}`);

  let scope = yield* useScope();
  let checkouts = new Map<string, Operation<string>>();

  // `git fetch` / `reset --hard` mutate a single working tree shared by every
  // request, so running them concurrently corrupts it (index-lock contention,
  // half-applied resets) — which surfaces as intermittent 500s when a wide
  // crawl hits many `/x` and `/contrib` pages at once. Memoize the checkout per
  // repository on the root scope: the first caller runs the git commands and
  // every concurrent or later caller awaits that same task, so each repository
  // is fetched and reset exactly once.
  yield* Clones.set((nameWithOwner) => {
    let checkout = checkouts.get(nameWithOwner);
    if (!checkout) {
      checkout = scope.run(() => cloneOrRefresh(path, nameWithOwner));
      checkouts.set(nameWithOwner, checkout);
    }
    return checkout;
  });
}

export function* useClone(nameWithOwner: string): Operation<string> {
  let checkout = yield* Clones.expect();
  return yield* checkout(nameWithOwner);
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
