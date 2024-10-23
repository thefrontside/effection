import { Context, Effect, Operation, Scope } from "./types.ts";
import { Ok } from "./result.ts";
import { useScope } from "./scope.ts";

export function createContext<T>(name: string, defaultValue?: T): Context<T> {
  let context: Context<T> = {
    name,
    defaultValue,
    *get(): Operation<T | undefined> {
      return (yield Get(context)) as T | undefined;
    },
    *set(value: T): Operation<T> {
      return (yield Set(context, value)) as T;
    },
    *expect(): Operation<T> {
      return (yield Expect(context)) as T;
    },
    *delete(): Operation<boolean> {
      return (yield Delete(context)) as boolean;
    },
    *with<R>(value: T, operation: (value: T) => Operation<R>): Operation<R> {
      let scope = yield* useScope();
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
  UseScope((scope) => scope.expect(context), `delete(${context.name})`);

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
