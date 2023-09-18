import type { Operation, Stream, Subscription } from "./types.ts";
import { createContext } from "./context.ts";

/**
 * Consume an effection stream using a simple for-of loop.
 *
 * Given any stream, you can access its values sequentially using the `each()`
 * operation just as you would use `for await of` loop with an async iterable:
 *
 * ```javascript
 * function* logvalues(stream) {
 *   for (let value of yield* each(stream)) {
 *     console.log(value);
 *     yield* each.next
 *   }
 * }
 * ```
 * You must always invoke `each.next` at the end of each iteration of the loop,
 * including if the interation ends with a `continue` statement.
 *
 * Note that just as with async iterators, there is no way to consume the
 * `TClose` value of a stream using the `for-each` loop.
 *
 * @typeParam T - the type of each value in the stream.
 * @param stream - the stream to iterate
 * @returns an operation to iterate `stream`
 */
export const each = iterate as Each;

/**
 * @ignore
 */
export type Each = typeof iterate & {
  /**
   * Indicate that the current iteration in a for-each loop is complete.
   *
   * @see {@link each}
   */
  next: Operation<void>;
};

interface EachLoop<T> {
  subscription: Subscription<T, unknown>;
  current: IteratorResult<T>;
  stale?: true;
}

const EachStack = createContext<EachLoop<unknown>[]>("each");

function iterate<T>(
  stream: Stream<T, unknown>,
  predicate?: (v: T | unknown) => boolean,
): Operation<Iterable<T>> {
  return {
    *[Symbol.iterator]() {
      let sub = yield* stream;
      let subscription = sub(predicate);
      let current = yield* subscription.next();
      let stack = yield* EachStack.get();
      if (!stack) {
        stack = yield* EachStack.set([]);
      }

      let context: EachLoop<T> = { subscription, current };

      stack.push(context);

      let iterator: Iterator<T> = {
        next() {
          if (context.stale) {
            let error = new Error(
              `for each loop did not use each.next operation before continuing`,
            );
            error.name = "IterationError";
            throw error;
          } else {
            context.stale = true;
            return context.current;
          }
        },
        return() {
          stack!.pop();
          return { done: true, value: void 0 };
        },
      };

      return {
        [Symbol.iterator]: () => iterator,
      };
    },
  };
}

iterate.next = {
  name: "each.next",
  *[Symbol.iterator]() {
    let stack = yield* EachStack;
    let context = stack[stack.length - 1];
    if (!context) {
      let error = new Error(`cannot call next() outside of an iteration`);
      error.name = "IterationError";
      throw error;
    }
    let current = yield* context.subscription.next();
    delete context.stale;
    context.current = current;
    if (current.done) {
      stack.pop();
    }
  },
} as Operation<void>;
