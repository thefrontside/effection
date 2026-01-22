import { createContext, type Operation, scoped, until } from "effection";
import { ProcessResult } from "@effectionx/process";
import { indent, log } from "./logging.ts";
import { join } from "@std/path";
import { useProcess } from "./process.ts";

const CwdContext = createContext<string>("cwd", Deno.cwd());

export function useCwd() {
  return CwdContext.expect();
}

export function* $(command: string): Operation<ProcessResult> {
  yield* log.debug(`$ ${command}`);
  return yield* useProcess(command);
}

export function* cwd<T extends readonly Operation<unknown>[]>(
  directory: string,
  ops: T,
): Operation<{ [K in keyof T]: T[K] extends Operation<infer R> ? R : never }> {
  return yield* scoped(function* () {
    yield* log.debug(`cwd: ${directory}`);
    let result = yield* CwdContext.with(directory, function* () {
      yield* indent();
      let results = [];
      for (let op of ops) {
        results.push(yield* op);
      }
      // deno-lint-ignore no-explicit-any
      return results as any;
    });
    return result;
  });
}

export function* $echo(
  data: string | ReadableStream<string>,
  filename: string | URL,
): Operation<void> {
  let cwd = yield* CwdContext.expect();
  if (typeof filename === "string") {
    yield* until(Deno.writeTextFile(join(cwd, filename), data));
    return;
  }
  yield* until(Deno.writeTextFile(new URL(filename, cwd), data));
}
