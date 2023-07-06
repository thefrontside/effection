export * from "https://deno.land/std@0.163.0/testing/bdd.ts";
export { expect, mock } from "https://deno.land/x/expect@v0.3.0/mod.ts";
export { expectType } from "https://esm.sh/ts-expect@1.3.0?pin=v123";

import { expect, type Operation, resource, sleep, spawn } from "../mod.ts";

declare global {
  // deno-lint-ignore no-empty-interface
  interface Promise<T> extends Operation<T> {}
}

Object.defineProperty(Promise.prototype, Symbol.iterator, {
  get<T>(this: Promise<T>) {
    return expect(this)[Symbol.iterator];
  },
});

export function* createNumber(value: number): Operation<number> {
  yield* sleep(1);
  return value;
}

export function* blowUp<T>(): Operation<T> {
  yield* sleep(1);
  throw new Error("boom");
}

export function* asyncResolve(
  duration: number,
  value: string,
): Operation<string> {
  yield* sleep(duration);
  return value;
}

export function* asyncReject(
  duration: number,
  value: string,
): Operation<string> {
  yield* sleep(duration);
  throw new Error(`boom: ${value}`);
}

export function* syncResolve(value: string): Operation<string> {
  return value;
}

export function* syncReject(value: string): Operation<string> {
  throw new Error(`boom: ${value}`);
}

export function asyncResource(
  duration: number,
  value: string,
  status: { status: string },
): Operation<string> {
  return resource(function* AsyncResource(provide) {
    yield* spawn(function* () {
      yield* sleep(duration + 10);
      status.status = "active";
    });
    yield* sleep(duration);
    yield* provide(value);
  });
}

export function useCommand(
  cmd: string,
  options?: Deno.CommandOptions,
): Operation<Deno.ChildProcess> {
  return resource(function* (provide) {
    let command = new Deno.Command(cmd, options);
    let process = command.spawn();
    try {
      yield* provide(process);
    } finally {
      try {
        process.kill("SIGINT");
      } catch (error) {
        // if the process already quit, then this error is expected.
        // unfortunately there is no way (I know of) to check this
        // before calling process.kill()

        if (
          !!error &&
          !error.message.includes("Child process has already terminated")
        ) {
          // deno-lint-ignore no-unsafe-finally
          throw error;
        }
      }
    }
  });
}
