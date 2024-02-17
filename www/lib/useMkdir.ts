import { isAbsolute } from "https://deno.land/std@0.201.0/path/is_absolute.ts";
import { call, createContext, Operation } from "effection";
import { useCwd } from "./useCwd.ts";
import { join } from "https://deno.land/std@0.203.0/path/join.ts";

export const MkdirContext = createContext<
  (path: string, options?: Deno.MkdirOptions) => Promise<void>
>(
  "sys.mkdir",
);

export function* useMkdir(
  path: string,
  options?: Deno.MkdirOptions,
): Operation<void> {
  const mkdir = yield* MkdirContext;

  if (isAbsolute(path)) {
    return yield* call(() => mkdir(path, options));
  } else {
    const cwd = yield* useCwd();
    return yield* call(() => mkdir(join(cwd, path), options));
  }
}
