import { isAbsolute } from "https://deno.land/std@0.201.0/path/is_absolute.ts";
import { join } from "https://deno.land/std@0.203.0/path/join.ts";
import { useCwd } from "./useCwd.ts";
import { Operation, call, createContext } from "effection";

export const ReadTextFileContext = createContext<(path: string) => Promise<string>>("sys.readTextFile")

export function* useReadTextFile(path: string): Operation<string> {
  const readTextFile = yield * ReadTextFileContext;
  if (isAbsolute(path)) {
    return yield * call(() => readTextFile(path));
  } else {
    const cwd = yield* useCwd();
    return yield * call(() => readTextFile(join(cwd, path)));
  }
}
