import type { Instruction, Operation } from "./types.ts";
import { action } from "./instructions.ts";
import { pause } from "./pause.ts";

/**
 * Pause the current operation, then runs a promise, async function, plain function,
 * or operation within a new scope. The calling operation will be resumed (or errored)
 * once call is completed.
 *
 * `call()` is a uniform integration point for calling async functions,
 * evaluating promises, generator functions, operations, and plain
 * functions.
 *
 * It can be used to treat a promise as an operation:
 *
 * @example
 * ```js
 * let response = yield* call(fetch('https://google.com'));
 * ```
 *
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
 * resources allocated will be cleaned up:
 *
 * @example
 * ```js
 * yield* call(function*() {
 *   let socket = yield* useSocket();
 *   return yield* socket.read();
 * }); // => socket is destroyed before returning
 * ```
 *
 * It can be used to run a plain function:
 *
 * @example
 * ```js
 * yield* call(() => "a string");
 * ```
 *
 * Because `call()` runs within its own {@link Scope}, it can also be used to
 * establish {@link  * establish error boundaries https://frontside.com/effection/docs/errors | error boundaries}.
 *
 * @example
 * ```js
 * function* myop() {
 *   let task = yield* spawn(function*() {
 *     throw new Error("boom!");
 *   });
 *   yield* task;
 * }
 *
 * function* runner() {
 *   try {
 *     yield* myop();
 *   } catch (err) {
 *     // this will never get hit!
 *   }
 * }
 *
 * function* runner() {
 *   try {
 *     yield* call(myop);
 *   } catch(err) {
 *     // properly catches `spawn` errors!
 *   }
 * }
 * ```
 *
 * @param callable the operation, promise, async function, generator funnction, or plain function to call as part of this operation
 */
export function call<T>(callable: () => Operation<T>): Operation<T>;
export function call<T>(callable: () => Promise<T>): Operation<T>;
export function call<T>(callable: () => T): Operation<T>;
export function call<T>(callable: Operation<T>): Operation<T>;
export function call<T>(callable: Promise<T>): Operation<T>;
export function call<T>(callable: Callable<T>): Operation<T> {
  return action(function* (resolve, reject) {
    try {
      if (typeof callable === "function") {
        let fn = callable as () => Operation<T> | Promise<T> | T;
        resolve(yield* toop(fn()));
      } else {
        resolve(yield* toop(callable));
      }
    } catch (error) {
      reject(error);
    }
  });
}

function toop<T>(
  op: Operation<T> | Promise<T> | T,
): Operation<T> {
  if (isPromise(op)) {
    return expect(op);
  } else if (isIterable(op)) {
    let iter = op[Symbol.iterator]();
    if (isInstructionIterator<T>(iter)) {
      // operation
      return op;
    } else {
      // We are assuming that if an iterator does *not* have `.throw` then
      // it must be a built-in iterator and we should return the value as-is.
      return bare(op as T);
    }
  } else {
    return bare(op as T);
  }
}

function bare<T>(val: T): Operation<T> {
  return {
    [Symbol.iterator]() {
      return { next: () => ({ done: true, value: val }) };
    },
  };
}

function expect<T>(promise: Promise<T>): Operation<T> {
  return pause((resolve, reject) => {
    promise.then(resolve, reject);
    return () => {};
  });
}

function isFunc(f: unknown): f is (...args: unknown[]) => unknown {
  return typeof f === "function";
}

function isPromise<T>(p: unknown): p is Promise<T> {
  if (!p) return false;
  return isFunc((p as Promise<T>).then);
}

// iterator must implement both `.next` and `.throw`
// built-in iterators are not considered iterators to `call()`
function isInstructionIterator<T>(it: unknown): it is Iterator<Instruction, T> {
  if (!it) return false;
  return isFunc((it as Iterator<Instruction, T>).next) &&
    isFunc((it as Iterator<Instruction, T>).throw);
}

function isIterable<T>(it: unknown): it is Iterable<T> {
  if (!it) return false;
  return typeof (it as Iterable<T>)[Symbol.iterator] === "function";
}

export type Callable<T> =
  | Operation<T>
  | Promise<T>
  | (() => Operation<T>)
  | (() => Promise<T>)
  | (() => T);
