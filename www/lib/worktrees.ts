import { createContext, type Operation } from "effection";
import { $ } from "../context/shell.ts";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const Worktrees = createContext<string>("worktrees");

export function* initWorktrees(path: string): Operation<void> {
  yield* $(`rm -rf ${path}`);
  yield* $(`mkdir -p ${path}`);
  yield* Worktrees.set(path);
}

export function* useWorktree(refname: string): Operation<string> {
  let basepath = yield* Worktrees.expect();
  let checkout = resolve(`${basepath}/${refname}`);
  if (!existsSync(checkout)) {
    yield* $(`git worktree add --force ${checkout} ${refname}`);
  }
  return checkout;
}
