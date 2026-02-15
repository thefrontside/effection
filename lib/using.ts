import { call } from "./call.ts";
import { resource } from "./resource.ts";

type DisposableLike = {
  [Symbol.dispose]?(): void;
  [Symbol.asyncDispose]?(): PromiseLike<void> | void;
};

function getDisposer(value: DisposableLike): () => PromiseLike<void> | void {
  let asyncDispose = value[Symbol.asyncDispose];

  if (typeof asyncDispose === "function") {
    return asyncDispose.bind(value);
  }

  let dispose = value[Symbol.dispose];

  if (typeof dispose === "function") {
    return dispose.bind(value);
  }

  throw new TypeError(
    "using() value must implement Symbol.dispose or Symbol.asyncDispose",
  );
}

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
export function* using<T extends Disposable | AsyncDisposable>(value: T) {
  let disposer = getDisposer(value);

  return yield* resource<T>(function* (provide) {
    try {
      yield* provide(value);
    } finally {
      yield* call(() => disposer());
    }
  });
}
