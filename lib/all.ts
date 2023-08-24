// deno-lint-ignore-file no-explicit-any
import type { Operation, Task } from "./types.ts";
import { spawn } from "./instructions.ts";
import { call } from "./call.ts";

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
 * @param ops a list of operations to wait for
 * @returns the list of values that the operations evaluate to, in the order they were given
 */
export function all<T extends Operation<any>[]>(ops: T): Operation<All<T>> {
  return call<All<T>>(function* () {
    let tasks: Task<T>[] = [];
    for (let operation of ops) {
      tasks.push(yield* spawn(() => operation));
    }
    let results = [] as All<T>;
    for (let task of tasks) {
      results.push(yield* task);
    }
    return results;
  });
}

/**
 * This type allows you to infer heterogenous operation types.
 * e.g. `all([sleep(0), expect(fetch("https://google.com")])`
 * will have a type of `Operation<Array<void | Request>>`
 */
type All<T extends Operation<any>[]> = {
  [P in keyof T]: T[P] extends Operation<infer TArg> ? TArg : never;
};
