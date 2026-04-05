import { createContext, type Operation } from "effection";
import { $ } from "../context/shell.ts";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const Clones = createContext<string>("clones");

export function* initClones(path: string): Operation<void> {
  yield* $(`rm -rf ${path}`);
  yield* $(`mkdir -p ${path}`);
  yield* Clones.set(path);
}

export function* useClone(nameWithOwner: string): Operation<string> {
  let basepath = yield* Clones.expect();
  let dirpath = resolve(`${basepath}/${nameWithOwner}`);
  if (!existsSync(dirpath)) {
    yield* $(`git clone https://github.com/${nameWithOwner} ${dirpath}`);
  } else {
    yield* $(`git -C ${dirpath} fetch origin`);
    yield* $(`git -C ${dirpath} reset --hard origin/main`);
  }
  return dirpath;
}
