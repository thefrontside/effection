import { call, Operation } from 'effection';
import { CwdContext } from "./useCwd.ts";
import { MakeTmpDir } from "./useTmpCwd.ts";

export function withDeno<T>(op: () => Operation<T>) {
  return call(function* () {
    yield* useDeno();
    yield* op();
  });
}

export function* useDeno() {
    yield* CwdContext.set(Deno.cwd);
    yield* MakeTmpDir.set(Deno.makeTempDirSync);
}
