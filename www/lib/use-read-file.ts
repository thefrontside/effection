import { isAbsolute } from "https://deno.land/std@0.201.0/path/is_absolute.ts";
import { join } from "https://deno.land/std@0.203.0/path/join.ts";
import { useCwd } from "./use-cwd.ts";
import { Operation, call } from "effection";

export function* useReadFile(path: string): Operation<Uint8Array> {
  if (isAbsolute(path)) {
    return yield* call(() => Deno.readFile(path));
  } else {
    const cwd = yield* useCwd();
    return yield* call(() => Deno.readFile(join(cwd, path)));
  }
}
