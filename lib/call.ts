import type { Operation } from "./types.ts";
import { action } from "./instructions.ts";
import { pause } from "./pause.ts";

/**
 * Pause the current operation, and run a promises, async functions, or
 * operations within a new scope. The calling operation will resumed (or errored)
 * once call is completed.
 *
 * `call()` is a uniform integration point for calling async functions,
 * evaluating promises; as well as generator functions and operations. It can be
 * used to treat a promise as an operation.
 *
 * @example
 * ```js
 * let response = yield* call(fetch('https://google.com'));
 * ```
 * or an async function:
 *
 * @example
 * '''ts
 * async function* googleSlowly() {
 *   return yield* call(async function() {
 *     await new Promise(resolve => setTimeout(resolve, 2000));
 *     return await fetch("https://google.com");
 *   });
 * }
 * ``'
 *
 * It can be used to run an operation in a separate scope to ensure that any
 * resources allocated:
 *
 * @example
 * ```js
 * yield* call(function*() {
 *   let socket = yield* useSocket();
 *   return yield* socket.read();
 * }); //=> socket is destroyed before returning
 * ```
 *
 * Because `call()` runs within its own {@link Scope}, it can also be used to
 * establish {@link  * establish error boundarieshttps://frontside.com/effection/docs/errors | error boundaries}.
 *
 * @param operator the operation, promise, async function, or generator funnction to call as part of this operation
 */
export function call<T>(operator: () => Operation<T>): Operation<T>;
export function call<T>(operator: () => Promise<T>): Operation<T>;
export function call<T>(operator: Operation<T>): Operation<T>;
export function call<T>(operator: Promise<T>): Operation<T>;
export function call<T>(operator: Operator<T>): Operation<T> {
  return action(function* (resolve, reject) {
    try {
      let op = typeof operator === "function" ? operator() : operator;
      if (typeof (op as Operation<T>)[Symbol.iterator] === "function") {
        resolve(yield* op);
      } else {
        //@ts-expect-error this is because we monkey-patch the tests
        resolve(yield* expect(op));
      }
    } catch (error) {
      reject(error);
    }
  });
}

function expect<T>(promise: Promise<T>): Operation<T> {
  return pause((resolve, reject) => {
    promise.then(resolve, reject);
    return () => {};
  });
}

type Operator<T> =
  | Operation<T>
  | Promise<T>
  | (() => Operation<T>)
  | (() => Promise<T>);
