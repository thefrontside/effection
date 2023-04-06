export * from "https://deno.land/std@0.163.0/testing/bdd.ts";
export { expect, mock } from "https://deno.land/x/expect@v0.3.0/mod.ts";

import { Operation, resource, sleep, spawn } from "../mod.ts";

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
