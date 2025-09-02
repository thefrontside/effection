import {
  createContext,
  type Operation,
  until,
} from "effection";
import { useProcess, capture } from "./process.ts";
import { log } from "./logging.ts";
import { join } from "@std/path";

const CwdContext = createContext<string | URL>(Deno.cwd());

export function* $(command: string): Operation<void> {
  const cwd = yield* CwdContext.expect();
  const result = yield* capture(useProcess(command, { cwd }));
  if (result.code !== 0) {
    yield* log.debug(result.stdout);
    throw new Error(`Failed to execute ${command}`, {
      cause: result.stderr
    })
  }
}

export function* cwd(directory: string | URL, ops: Operation<void>[]) {
  yield* CwdContext.with(directory, function*() {
    for (const op of ops) {
      yield* op;
    }
  });
}

export function* $echo(data: string | ReadableStream<string>, filename: string | URL): Operation<void> {
  const cwd = yield* CwdContext.expect();
  if (typeof filename === "string") {
    yield* until(Deno.writeTextFile(join(cwd, filename), data));
    return;
  }
  yield* until(Deno.writeTextFile(new URL(filename, cwd), data));
}