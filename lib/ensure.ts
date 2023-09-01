import { Operation } from "./types.ts";
import { resource } from "./instructions.ts";

/**
 * Run the given function or operation when the current operation
 * shuts down. This is equivalent to running the function or operation
 * in a `finally {}` block, but it can help you avoid rightward drift.
 *
 * @example <caption>using a function</caption>
 *
 * ```javascript
 * import { main, ensure } from 'effection';
 * import { createServer } from 'http';
 *
 * await main(function*() {
 *   let server = createServer(...);
 *   yield* ensure(() => { server.close() });
 * });
 * ```
 *
 * Note that you should wrap the function body in braces, so the function
 * returns `undefined`.
 *
 * @example <caption>using operation</caption>
 *
 * ```javascript
 * import { main, ensure, once } from 'effection';
 * import { createServer } from 'http';
 *
 * await main(function*() {
 *   let server = createServer(...);
 *   yield* ensure(function* () {
 *     server.close();
 *     yield* once(server, 'closed');
 *   });
 * });
 * ```
 *
 * Your ensure function should return an operation whenever you need to do
 * asynchronous cleanup. Otherwise, you can return `void`
 *
 * @param fn - a function which returns an {@link Operation} or void
 */
export function ensure(fn: () => Operation<unknown> | void): Operation<void> {
  return resource(function* (provide) {
    try {
      yield* provide();
    } finally {
      let result = fn();
      if (result && typeof result[Symbol.iterator] === "function") {
        yield* result;
      }
    }
  });
}
