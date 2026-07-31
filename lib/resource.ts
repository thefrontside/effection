import { suspend } from "./suspend.ts";
import type { Operation } from "./types.ts";
import { createTask } from "./task.ts";
import type { ScopeInternal } from "./scope-internal.ts";
import { trap } from "./trap.ts";
import { withResolvers } from "./with-resolvers.ts";
import { useScope } from "./scope.ts";

/**
 * Define an Effection [resource](https://frontside.com/effection/docs/resources)
 *
 * Resources are a type of operation that passes a value back to its caller
 * while still allowing that operation to run in the background. It does this
 * by invoking the special `provide()` operation. The caller pauses until the
 * resource operation invokes `provide()` at which point the caller resumes with
 * passed value.
 *
 * `provide()` suspends the resource operation until the caller passes out of
 * scope.
 *
 * @example
 * ```javascript
 * function useWebSocket(url) {
 *   return resource(function*(provide) {
 *     let socket = new WebSocket(url);
 *     yield* once(socket, 'open');
 *
 *     yield* ensure(function*() {
 *       socket.close();
 *       yield* once(socket, 'close');
 *     });
 *
 *     yield* provide(socket);
 *   })
 * }
 *
 * await main(function*() {
 *   let socket = yield* useWebSocket("wss://example.com");
 *   socket.send("hello world");
 * });
 * ```
 *
 * @param operation the operation defining the lifecycle of the resource
 * @returns an operation yielding the resource
 * @since 3.0
 */
export function resource<T>(
  op: (provide: Provide<T>) => Operation<void>,
): Operation<T> {
  return {
    *[Symbol.iterator]() {
      let ready = withResolvers<T>();

      function* provide(value: T): Operation<void> {
        ready.resolve(value);
        yield* suspend();
      }

      let caller = yield* useScope();

      // establishing a control boundary lets us catch errors in
      // resource initializer
      return yield* trap<T>(function* () {
        createTask<void>({
          owner: caller as ScopeInternal,
          operation: () => op(provide),
          prioritize: true,
        });

        return yield* ready.operation;
      });
    },
  };
}

/**
 * @since 3.0
 */
export interface Provide<T> {
  /**
   * Provide `value` to the calling operation as a resource.
   * @returns an operation that suspends the resource operation until the caller is completed.
   */
  (value: T): Operation<void>;
}
