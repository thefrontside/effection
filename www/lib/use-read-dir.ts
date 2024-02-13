import { Operation, stream, Stream } from "effection";
import { isAbsolute } from "https://deno.land/std@0.201.0/path/is_absolute.ts";
import { join } from "https://deno.land/std@0.203.0/path/join.ts";
import { useCwd } from "./use-cwd.ts";

export function* useReadDir(path: string): Operation<Stream<Deno.DirEntry, unknown>> {
  if (isAbsolute(path)) {
    return stream(Deno.readDir(path));
  } else {
    const cwd = yield* useCwd();
    return stream(Deno.readDir(join(cwd, path)));
  }
}