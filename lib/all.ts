import type { Operation, Task, Yielded } from "./types.ts";
import { spawn } from "./spawn.ts";
import { trap } from "./task.ts";
import { box } from "./box.ts";
import { Err, Ok, Result } from "./result.ts";
import { withResolvers } from "./with-resolvers.ts";

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
export function* all<T extends readonly Operation<unknown>[] | []>(
  ops: T,
): Operation<All<T>> {
  let tasks: Task<unknown>[] = [];
  let results: unknown[] = [];
  let result = withResolvers<Result<unknown[]>>();

  return yield* trap(function* (): Operation<All<T>> {
    for (let operation of ops) {
      tasks.push(yield* spawn(function*() {
	try {
	  results.push(yield* operation);
	  if (results.length === ops.length) {
	    result.resolve(Ok(results));
	  }
	} catch (error) {
	  result.resolve(Err(error as Error));
	}
      }));
    }

    let outcome = yield* result.operation;
    if (outcome.ok) {
      return outcome.value as All<T>;
    } else {
      throw outcome.error;
    }
  });
}

/**
 * This type allows you to infer heterogenous operation types.
 * e.g. `all([sleep(0), expect(fetch("https://google.com")])`
 * will have a type of `Operation<[void, Request]>`
 */

type All<T extends readonly Operation<unknown>[] | []> = {
  -readonly [P in keyof T]: Yielded<T[P]>;
};
