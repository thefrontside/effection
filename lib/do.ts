import type { Result } from "./result.ts";
import type { Effect, Operation } from "./types.ts";

/**
 * Perform a single Effect as an Operation
 */
export function Do<T>(effect: Effect<T>): Operation<T> {
  return {
    [Symbol.iterator]() {
      let result: Result<T> | undefined = undefined;
      let perform: Effect<T> = {
        description: `do <${effect.description}>`,
        enter(resolve, routine) {
          return effect.enter((r) => {
            resolve(result = r);
          }, routine);
        },
      };

      return {
        next() {
          if (result) {
            if (result.ok) {
              return { done: true, value: result.value };
            } else {
              throw result.error;
            }
          } else {
            return { done: false, value: perform };
          }
        },
      };
    },
  };
}
