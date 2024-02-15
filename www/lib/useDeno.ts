import { call, Operation } from 'effection';
import { CwdContext } from "./useCwd.ts";
import { MakeTmpDirContext } from "./useTmpCwd.ts";
import { ReadDirContext } from "./useReadDir.ts";
import { MkdirContext } from "./useMkdir.ts";

export function withDeno<T>(op: () => Operation<T>) {
  return call(function* () {
    yield* useDeno();
    yield* op();
  });
}

export function* useDeno() {
    yield* CwdContext.set(Deno.cwd);
    yield* MakeTmpDirContext.set(Deno.makeTempDirSync);
    yield* ReadDirContext.set(Deno.readDir);
    yield* MkdirContext.set(Deno.mkdir);
}
