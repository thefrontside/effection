import { createContext, Operation, stream, Stream } from "effection";
import { isAbsolute } from "https://deno.land/std@0.201.0/path/is_absolute.ts";
import { join } from "https://deno.land/std@0.203.0/path/join.ts";
import { useCwd } from "./useCwd.ts";

export const ReadDirContext = createContext<(path: string) => AsyncIterable<Deno.DirEntry>>("sys.readDir")

export function* useReadDir(path: string): Operation<Stream<Deno.DirEntry, unknown>> {
  const readDir = yield* ReadDirContext;

  if (isAbsolute(path)) {
    return stream(readDir(path));
  } else {
    const cwd = yield* useCwd();
    return stream(readDir(join(cwd, path)));
  }
}