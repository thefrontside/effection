import { call } from "./call.ts";
import { resource } from "./resource.ts";
import type { Operation } from "./types.ts";

/**
 * Bind a JavaScript disposable value to the current Effection scope.
 *
 * The provided value is yielded immediately, then disposed when the owning
 * scope exits (on return, error, or halt).
 *
 * @example
 * ```ts
 * import { run, using } from "effection";
 *
 * class Connection {
 *   opened = true;
 *   [Symbol.dispose]() {
 *     this.opened = false;
 *   }
 * }
 *
 * await run(function* () {
 *   let connection = yield* using(new Connection());
 *   connection.opened; // true while in scope
 * });
 * ```
 */
export function* using<T extends Disposable | AsyncDisposable>(
  value: T,
): Operation<T> {
  let dispose = Symbol.asyncDispose in value
    ? value[Symbol.asyncDispose]
    : Symbol.dispose in value
    ? value[Symbol.dispose]
    : undefined;

  if (!dispose) {
    throw new TypeError(
      "using() value must implement Symbol.dispose or Symbol.asyncDispose",
    );
  }

  return yield* resource<T>(function* (provide) {
    try {
      yield* provide(value);
    } finally {
      yield* call(() => dispose.call(value));
    }
  });
}
