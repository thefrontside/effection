import { suspend } from "./suspend.ts";
import { spawn } from "./spawn.ts";
import type { Operation } from "./types.ts";
import { trap } from "./task.ts";
import { Ok } from "./result.ts";
import { useCoroutine } from "./coroutine.ts";

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
 *     try {
 *       yield* provide(socket);
 *     } finally {
 *       socket.close();
 *       yield* once(socket, 'close');
 *     }
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
 */
export function resource<T>(
  op: (provide: Provide<T>) => Operation<void>,
): Operation<T> {
  return {
    *[Symbol.iterator]() {
      let caller = yield* useCoroutine();

      function* provide(value: T): Operation<void> {
        caller.next(Ok(value));
        yield* suspend();
      }

      // establishing a control boundary lets us catch errors in
      // resource initializer
      return yield* trap<T>(function* () {
        yield* spawn(() => op(provide));
        return (yield {
          description: "await resource",
          enter: () => (uninstalled) => uninstalled(Ok()),
        }) as T;
      });
    },
  };
}

export interface Provide<T> {
  /**
   * Provide `value` to the calling operation as a resource.
   * @returns an operation that suspends the resource operation until the caller is completed.
   */
  (value: T): Operation<void>;
}
