import type { Operation, Result, WithResolvers } from "effection";
import { call, ensure, Err, Ok, spawn, withResolvers } from "effection";

/**
 * Resolve a Chain
 */
export type Resolve<T> = WithResolvers<T>["resolve"];

/**
 * Reject a chain
 */
export type Reject = WithResolvers<unknown>["reject"];

/**
 * Represent the eventual completion of an [Operation] in a fashion
 * that mirrors the * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise Promise}
 * implementation
 */
export class Chain<T> implements From<T> {
  private resolvers = withResolvers<T>();

  /**
   * Create a chain from any operation.
   */
  static from = from;

  constructor(compute: (resolve: Resolve<T>, reject: Reject) => void) {
    let { resolve, reject } = this.resolvers;
    compute(resolve, reject);
  }

  then<B>(fn: (value: T) => Operation<B>): From<B> {
    let { operation } = this.resolvers;
    return from(operation).then(fn);
  }

  catch<B>(fn: (error: unknown | Error) => Operation<B>): From<T | B> {
    let { operation } = this.resolvers;
    return from(operation).catch(fn);
  }

  finally(fn: () => Operation<void>): From<T> {
    let { operation } = this.resolvers;
    return from(operation).finally(fn);
  }

  [Symbol.iterator](): ReturnType<From<T>[typeof Symbol.iterator]> {
    return this.resolvers.operation[Symbol.iterator]();
  }
}

export interface From<A> extends Operation<A> {
  /**
   * Create a new chain that will resolve to the current chain's value after
   * applying `fn`;
   *
   * @param `fn` - is applied to the source operation's result to create the chained operation's result
   *
   * @returns a new {Chain} representing this application
   */
  then<B>(fn: (value: A) => Operation<B>): From<B>;

  /**
   * Create a new chain that will resolve to the original chain's
   * value, or the result of `fn` in the event that the current chain
   * rejects. applying `fn`;
   *
   * @param `fn` - applied when the current chain rejects and becomes the result of chain
   *
   * @returns a new {Chain} representing the potentially caught rejection
   */
  catch<B>(fn: (error: unknown | Error) => Operation<B>): From<A | B>;

  /**
   * Create a new {Chain} that behaves exactly like the original chain, except that operation specified with
   * `fn` will run in all cases.
   *
   * @param `fn` - a function returning an operation that is always
   *   evaluate just before the current chain yields its value.
   */
  finally(fn: () => Operation<void>): From<A>;
}

function from<T>(source: Operation<T>): From<T> {
  let resolvers: WithResolvers<T> | undefined = undefined;
  let chain: From<T> = {
    *[Symbol.iterator]() {
      if (!resolvers) {
        resolvers = withResolvers<T>();
        try {
          resolvers.resolve(yield* source);
        } catch (e) {
          resolvers.reject(e as Error);
        }
      }
      return yield* resolvers.operation;
    },
    then: (fn) =>
      from(
        call(function* () {
          return yield* fn(yield* chain);
        }),
      ),

    catch: (fn) =>
      from(
        call(function* () {
          try {
            return yield* chain;
          } catch (e) {
            return yield* fn(e);
          }
        }),
      ),

    // We can't use `scoped` here to prevent losing the halt on effection
    // older than 4.1, where its own async teardown has that bug.
    finally: (fn) =>
      from(
        call(function* (): Operation<T> {
          let task = yield* spawn(function* (): Operation<Result<T>> {
            yield* ensure(fn);
            // Don't let this throw to prevent the error from also reaching
            // the owning scope, where it escapes the caller's catch and
            // tears the scope down.
            try {
              return Ok(yield* chain);
            } catch (error) {
              return Err(error as Error);
            }
          });
          let result = yield* task;
          if (result.ok) {
            return result.value;
          }
          throw result.error;
        }),
      ),
  };
  return chain;
}
