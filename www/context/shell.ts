import { createContext, type Operation, until } from "effection";
import { capture, useProcess } from "./process.ts";
import { log } from "./logging.ts";
import { join } from "@std/path";

const CwdContext = createContext<string | URL>(Deno.cwd());

export function* $(
  command: string,
): Operation<
  { stdout: string; stderr: string; code: number; signal?: Deno.Signal }
> {
  const cwd = yield* CwdContext.expect();
  const result = yield* capture(useProcess(command, { cwd }));
  if (result.code !== 0) {
    yield* log.debug(result.stdout);
    throw new Error(`Failed to execute ${command}`, {
      cause: result.stderr,
    });
  }
  return result;
}

export function* cwd<T extends readonly Operation<unknown>[]>(
  directory: string | URL, 
  ops: T
): Operation<{ [K in keyof T]: T[K] extends Operation<infer R> ? R : never }> {
  return yield* CwdContext.with(directory, function* () {
    const results = [];
    for (const op of ops) {
      results.push(yield* op);
    }
    return results as any;
  });
}

export function* $echo(
  data: string | ReadableStream<string>,
  filename: string | URL,
): Operation<void> {
  const cwd = yield* CwdContext.expect();
  if (typeof filename === "string") {
    yield* until(Deno.writeTextFile(join(cwd, filename), data));
    return;
  }
  yield* until(Deno.writeTextFile(new URL(filename, cwd), data));
}
