import { Err, Ok, Result } from "./result.ts";
import { action } from "./action.ts";
import type { Operation } from "./types.ts";

export interface WithResolvers<T> {
  operation: Operation<T>;
  resolve(value: T): void;
  reject(error: Error): void;
}

export function withResolvers<T>(description?: string): WithResolvers<T> {
  let continuations = new Set<(result: Result<T>) => void>();
  let result: Result<T> | undefined = undefined;

  let operation: Operation<T> = action<T>(
    function (resolve, reject) {
      let settle = (outcome: Result<T>) => {
        if (outcome.ok) {
          resolve(outcome.value);
        } else {
          reject(outcome.error);
        }
      };

      if (result) {
        settle(result);
        return () => {};
      } else {
        continuations.add(settle);
        return () => continuations.delete(settle);
      }
    },
    description,
  );

  let settle = (outcome: Result<T>) => {
    if (!result) {
      result = outcome;
    }
    for (let continuation of continuations) {
      continuation(result);
    }
  };

  let resolve = (value: T) => settle(Ok(value));
  let reject = (error: Error) => settle(Err(error));

  return { operation, resolve, reject };
}
