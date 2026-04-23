import { all } from "./all.ts";
import { box } from "./box.ts";
import type { Result } from "./result.ts";
import type { Operation, Yielded } from "./types.ts";

/**
 * Block and wait for all of the given operations to settle. Returns
 * an array of results indicating whether each operation succeeded or
 * errored. This has the same purpose as
 * [Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled).
 *
 * Unlike {@link all}, `allSettled` never rejects — every operation
 * result is represented as either `{ ok: true, value }` or
 * `{ ok: false, error }`.
 *
 * ### Example
 *
 * ``` javascript
 * import { allSettled, expect, main } from 'effection';
 *
 * await main(function*() {
 *  let [google, notASite] = yield* allSettled([
 *    expect(fetch('http://google.com')),
 *    expect(fetch('http://nope.example')),
 *   ]);
 *  // google => { ok: true, value: Response }
 *  // notASite => { ok: false, error: Error }
 * });
 * ```
 *
 * @param ops a list of operations to wait for
 * @returns the list of settled results, in the order they were given
 * @since 4.1
 */
export function* allSettled<T extends readonly Operation<unknown>[] | []>(
  ops: T,
): Operation<AllSettled<T>> {
  let results = yield* all(
    ops.map((operation) => box(() => operation)) as {
      [P in keyof T]: Operation<Result<Yielded<T[P]>>>;
    },
  );
  return results as AllSettled<T>;
}

/**
 * This type allows you to infer heterogenous operation types.
 * e.g. `allSettled([sleep(0), expect(fetch("https://google.com"))])`
 * will have a type of `Operation<[Result<void>, Result<Request>]>`
 */
type AllSettled<T extends readonly Operation<unknown>[] | []> = {
  -readonly [P in keyof T]: Result<Yielded<T[P]>>;
};
