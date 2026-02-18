import type { Context, Effect, Operation, Scope } from "./types.ts";
import { Ok } from "./result.ts";
import { Do } from "./do.ts";

/**
 * Create a new {@link Context}
 *
 * @param name - the unique name to give this context.
 * @returns the new context
 * @since 3.0
 */
export function createContext<T>(name: string, defaultValue?: T): Context<T> {
  let context: Context<T> = {
    name,
    defaultValue,
    get: () => Do(Get(context)),
    set: (value) => Do(Set(context, value)),
    expect: () => Do(Expect(context)),
    delete: () => Do(Delete(context)),
    *with<R>(value: T, operation: (value: T) => Operation<R>): Operation<R> {
      let scope = yield* Do(UseScope((scope) => scope, "useScope()"));
      let original = scope.hasOwn(context) ? scope.get(context) : undefined;
      try {
        return yield* operation(scope.set(context, value));
      } finally {
        if (typeof original === "undefined") {
          scope.delete(context);
        } else {
          scope.set(context, original);
        }
      }
    },
  };

  return context;
}

// private effects for efficiency.
const Get = <T>(context: Context<T>) =>
  UseScope((scope) => scope.get(context), `get(${context.name})`);
const Set = <T>(context: Context<T>, value: T) =>
  UseScope(
    (scope) => scope.set(context, value),
    `set(${context.name}, ${value})`,
  );
const Expect = <T>(context: Context<T>) =>
  UseScope((scope) => scope.expect(context), `expect(${context.name})`);
const Delete = <T>(context: Context<T>) =>
  UseScope((scope) => scope.delete(context), `delete(${context.name})`);

function UseScope<T>(fn: (scope: Scope) => T, description: string): Effect<T> {
  return {
    description,
    enter: (resolve, { scope }) => {
      resolve(Ok(fn(scope)));
      return (resolve) => {
        resolve(Ok());
      };
    },
  };
}
