import { Operation } from "effection";
import { CwdContext } from "./useCwd.ts";
import { createContext } from 'effection';

export const MakeTmpDirContext = createContext<() => string>("sys.makeTmpDir");

export function* withTmpCwd<T>(op: () => Operation<T>): Operation<T> {
  let current = yield* CwdContext;
  const makeTmpDir = yield* MakeTmpDirContext;

  const cwd = makeTmpDir();

  yield* CwdContext.set(() => cwd);
  try {
    return yield* op();
  } finally {
    yield* CwdContext.set(current);
  }
}

export function* useTmpCwd() {
  const makeTmpDir = yield* MakeTmpDirContext;
  
  const dir = makeTmpDir();

  yield * CwdContext.set(() => dir);

  return dir;
}
