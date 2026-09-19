import type {
  Context,
  ContextBinding,
  Effect,
  Operation,
  RequirementsOf,
  Scope,
  Yielded,
} from "./types.ts";
import { Ok } from "./result.ts";
import { Do } from "./do.ts";

/**
 * Create a new {@link Context}
 *
 * @example
 * ```ts
 * import { createContext, main } from "effection";
 *
 * const YourContext = createContext<string>("context-id");
 *
 * await main(function* () {
 *   yield* YourContext.with("abc-123", function* () {
 *     console.log(yield* YourContext.expect()); // "abc-123"
 *   });
 * });
 * ```
 *
 * @param name - the unique name to give this context.
 * @returns the new context
 * @since 3.0
 */
export function createContext<T, const Name extends string = string>(
  name: Name,
): Context<T, Name, false>;
export function createContext<T, const Name extends string = string>(
  name: Name,
  defaultValue: T,
): Context<T, Name, true>;
export function createContext<T, const Name extends string = string>(
  name: Name,
  defaultValue?: T,
): Context<T, Name, boolean> {
  let context = {
    name,
    defaultValue,
    get: () => Do(Get(context)),
    set: (value) => Do(Set(context, value)),
    expect: () => Do(Expect(context)),
    delete: () => Do(Delete(context)),
    of(value: T): ContextBinding<T, Name, never> {
      return { context, value };
    },
    from<Provider extends Operation<T, unknown>>(
      operation: Provider,
    ): ContextBinding<T, Name, RequirementsOf<Provider>> {
      return {
        context,
        operation: operation as Operation<T, RequirementsOf<Provider>>,
      };
    },
    *with<Child extends Operation<unknown, unknown>>(
      value: T,
      operation: (value: T) => Child,
    ): Operation<Yielded<Child>, Exclude<RequirementsOf<Child>, Name>> {
      let scope = yield* Do(UseScope((scope) => scope, "useScope()"));
      let original = scope.hasOwn(context) ? scope.get(context) : undefined;
      try {
        return (yield* (operation(
          scope.set(context, value),
        ) as unknown as Operation<
          Yielded<Child>,
          Exclude<RequirementsOf<Child>, Name>
        >)) as Yielded<Child>;
      } finally {
        if (typeof original === "undefined") {
          scope.delete(context);
        } else {
          scope.set(context, original);
        }
      }
    },
  } as Context<T, Name, boolean>;

  return context as Context<T, Name, boolean>;
}

// private effects for efficiency.
const Get = <T>(context: Context<T>) =>
  UseScope((scope) => scope.get(context), `get(${context.name})`);
const Set = <T>(context: Context<T>, value: T) =>
  UseScope(
    (scope) => scope.set(context, value),
    `set(${context.name}, ${value})`,
  );
const Expect = <T, Name extends string, HasDefault extends boolean>(
  context: Context<T, Name, HasDefault>,
) =>
  UseScope<T, HasDefault extends true ? never : Name>(
    (scope) => scope.expect(context),
    `expect(${context.name})`,
  );
const Delete = <T>(context: Context<T>) =>
  UseScope((scope) => scope.delete(context), `delete(${context.name})`);

function UseScope<T, Requires = never>(
  fn: (scope: Scope) => T,
  description: string,
): Effect<T, Requires> {
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
