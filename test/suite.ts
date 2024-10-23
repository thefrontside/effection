import { action, call, resource, sleep, spawn } from "../mod.ts";

import { Operation } from "../lib/types.ts";

export {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.223.0/testing/bdd.ts";
export { expect } from "jsr:@std/expect";
export { expectType } from "npm:ts-expect@1.3.0";

export function* createNumber(value: number): Operation<number> {
  yield* sleep(1);
  return value;
}

export function* blowUp<T>(): Operation<T> {
  yield* sleep(1);
  throw new Error("boom");
}

declare global {
  interface Promise<T> extends Operation<T> {}
}

Object.defineProperty(Promise.prototype, Symbol.iterator, {
  get<T>(this: Promise<T>) {
    let then = this.then.bind(this);
    let suspense = action<T>(function wait(resolve, reject) {
      then(resolve, reject);
      return () => {};
    });
    return suspense[Symbol.iterator];
  },
});

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

export function* syncResolve(value: string): Operation<string> {
  return value;
}

export function* syncReject(value: string): Operation<string> {
  throw new Error(`boom: ${value}`);
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
        yield* call(() => process.status);
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
