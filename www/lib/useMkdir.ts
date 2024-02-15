import { isAbsolute } from "https://deno.land/std@0.201.0/path/is_absolute.ts";
import { Operation, call } from "effection";
import { useCwd } from "./useCwd.ts";
import { join } from "https://deno.land/std@0.203.0/path/join.ts";

export function* useMkdir(path: string, options?: Deno.MkdirOptions): Operation<void> {
  if (isAbsolute(path)) {
    return yield* call(() => Deno.mkdir(path, options));
  } else {
    const cwd = yield* useCwd();
    return yield* call(() => Deno.mkdir(join(cwd, path), options));
  }
}