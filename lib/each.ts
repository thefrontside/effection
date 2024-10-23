import type { Operation, Stream, Subscription } from "./types.ts";
import { createContext } from "./context.ts";
import { race } from "./race.ts";
import { resource } from "./resource.ts";
import { withResolvers } from "./with-resolvers.ts";
import { useScope } from "./scope.ts";

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
 *     yield* each.next()
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
export function each<T>(stream: Stream<T, unknown>): Operation<Iterable<T>> {
  return {
    *[Symbol.iterator]() {
      let scope = yield* useScope();
      if (!scope.hasOwn(EachStack)) {
        scope.set(EachStack, []);
      }
      return yield* resource(function* (provide) {
        let done = withResolvers<void>();

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

        let iterator: Iterator<T> = {
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
        };

        yield* race([
          done.operation,
          provide({
            [Symbol.iterator]: () => iterator,
          }),
        ]);
      });
    },
  };
}

each.next = function next() {
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
