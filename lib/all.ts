import type { Operation, Task, Yielded } from "./types.ts";
import { spawn } from "./spawn.ts";
import { trap } from "./task.ts";

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
 * @since 3.0
 */
export function* all<T extends readonly Operation<unknown>[] | []>(
  ops: T,
): Operation<All<T>> {
  let tasks: Task<unknown>[] = [];
  try {
    return yield* trap(function* (): Operation<All<T>> {
      for (let operation of ops) {
        let member = () => operation;
        tasks.push(yield* spawn(member));
      }
      let results: unknown[] = [];
      for (let task of tasks) {
        let result = yield* task;
        results.push(result);
      }
      return results as All<T>;
    });
  } catch (error) {
    for (let task of tasks) {
      yield* task.halt();
    }
    throw error;
  }
}

/**
 * This type allows you to infer heterogenous operation types.
 * e.g. `all([sleep(0), expect(fetch("https://google.com")])`
 * will have a type of `Operation<[void, Request]>`
 */

type All<T extends readonly Operation<unknown>[] | []> = {
  -readonly [P in keyof T]: Yielded<T[P]>;
};
