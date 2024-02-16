import { walk } from "https://deno.land/std@0.216.0/fs/walk.ts";
import { call, Operation } from "effection";
import { CwdContext } from "./useCwd.ts";
import { MakeTmpDirContext } from "./useTmpCwd.ts";
import { ReadDirContext } from "./useReadDir.ts";
import { MkdirContext } from "./useMkdir.ts";
import { EnvContext } from "./useEnv.ts";
import { WalkContext } from "./useWalk.ts";

export function withDeno<T>(op: () => Operation<T>) {
  return call(function* () {
    yield* initDeno();
    return yield* op();
  });
}

export function* initDeno() {
  yield* CwdContext.set(Deno.cwd);
  yield* MakeTmpDirContext.set(Deno.makeTempDir);
  yield* ReadDirContext.set(Deno.readDir);
  yield* MkdirContext.set(Deno.mkdir);
  yield* EnvContext.set(Deno.env);
  yield* WalkContext.set(walk);
}
