import { spawn } from "./spawn.ts";
import { constant } from "./constant.ts";
import { createContext } from "./context.ts";
import { useScope } from "./scope.ts";
import type { Operation, Stream, Subscription } from "./types.ts";
import { withResolvers } from "./with-resolvers.ts";

/**
 * Consume an Effection stream or subscription using a `for...of` loop.
 *
 * Given any stream or subscription, you can access its values sequentially
 * using the `each()` operation, just as you would use a `for await...of` loop
 * with an async iterable:
 *
 * @example
 * ```javascript
 * function* logValues(streamOrSubscription) {
 *   for (let value of yield* each(streamOrSubscription)) {
 *     console.log(value);
 *     yield* each.next();
 *   }
 * }
 * ```
 *
 * Pass an existing subscription when it must be active before iteration begins.
 *
 * You must always invoke `each.next()` at the end of each iteration of the loop,
 * including if the iteration ends with a `continue` statement.
 *
 * Note that just as with async iterators, there is no way to consume the
 * `TClose` value of a stream or subscription using the `for...of` loop.
 *
 * @typeParam T - the type of each value.
 * @param source - the stream or subscription to iterate
 * @returns an operation that iterates `source`
 * @since 3.0
 */
export function each<T>(
  source: Stream<T, unknown> | Subscription<T, unknown>,
): Operation<Iterable<T>> {
  return {
    *[Symbol.iterator]() {
      let stream = typeof (source as Subscription<T, unknown>).next ===
          "function"
        ? constant(source as Subscription<T, unknown>)
        : source as Stream<T, unknown>;

      let scope = yield* useScope();
      if (!scope.hasOwn(EachStack)) {
        scope.set(EachStack, []);
      }

      let done = withResolvers<void>();
      let cxt = withResolvers<EachLoop<T>>();

      yield* spawn(function* () {
        let subscription = yield* stream;
        let current = yield* subscription.next();

        let stack = scope.expect(EachStack);

        let context: EachLoop<T> = {
          subscription,
          current,
          finish() {
            context.finish = () => {};
            stack.pop();
            done.resolve();
          },
        };

        stack.push(context);

        cxt.resolve(context);

        yield* done.operation;
      });

      let context = yield* cxt.operation;

      return {
        [Symbol.iterator]: () => ({
          next() {
            if (context.stale) {
              let error = new Error(
                `for each loop did not use each.next() operation before continuing`,
              );
              error.name = "IterationError";
              throw error;
            } else {
              context.stale = true;
              return context.current;
            }
          },
          return() {
            context.finish();
            return { done: true, value: void 0 };
          },
        }),
      };
    },
  };
}

each.next = function next(): Operation<void> {
  return {
    name: "each.next()",
    *[Symbol.iterator]() {
      let stack = yield* EachStack.expect();
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
        context.finish();
      }
    },
  } as Operation<void>;
};

interface EachLoop<T> {
  subscription: Subscription<T, unknown>;
  current: IteratorResult<T>;
  finish: () => void;
  stale?: true;
}

const EachStack = createContext<EachLoop<unknown>[]>("each");
