// deno-lint-ignore-file no-explicit-any
import type { Operation, Task } from "./types.ts";
import { useScope } from "./run/scope.ts";

/**
 * Block and wait for all of the given operations to complete. Returns
 * an array of values that the given operations evaluated to. This has
 * the same purpose as
 * [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).
 *
 * If any of the operations become errored, then `all` will also become errored.
 *
 * ### Example
 *
 * ``` javascript
 * import { all, expect, main } from 'effection';
 *
 * await main(function*() {
 *  let [google, bing] = yield* all([
 *    expect(fetch('http://google.com')),
 *    expect(fetch('http://bing.com')),
 *   ]);
 *  // ...
 * });
 * ```
 *
 * @param operations a list of operations to wait for
 * @returns the list of values that the operations evaluate to, in the order they were given
 */
export function all<T extends Operation<any>[]>(
  operations: T,
): Operation<All<T>> {
  return {
    name: "all",
    count: operations.length,
    *[Symbol.iterator]() {
      let scope = yield* useScope();
      let tasks: Task<T>[] = [];
      for (let operation of operations) {
        tasks.push(scope.run(() => operation));
      }
      let results: T[] = [];
      for (let task of tasks) {
        results.push(yield* task);
      }
      return results;
    },
  } as Operation<All<T>>;
}

/**
 * This type allows you to infer heterogenous operation types.
 * e.g. `all([sleep(0), expect(fetch("https://google.com")])`
 * will have a type of `Operation<Array<void | Request>>`
 */
type All<T extends Operation<any>[]> = {
  [P in keyof T]: T[P] extends Operation<infer TArg> ? TArg : never;
};
