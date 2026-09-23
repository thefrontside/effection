import { scoped } from "./scoped.ts";
import type {
  ContextBinding,
  Operation,
  RequirementsOf,
  Yielded,
} from "./types.ts";

type AnyBinding = ContextBinding<unknown, string, Operation<unknown, unknown>>;

type BindingRequires<B> = B extends ContextBinding<
  unknown,
  string,
  infer Provider
> ? RequirementsOf<Provider>
  : never;

type BindingName<B> = B extends ContextBinding<
  unknown,
  infer N,
  Operation<unknown, unknown>
> ? N
  : never;

type SetupRequirements<
  Bindings extends readonly AnyBinding[],
  Available extends string = never,
> = Bindings extends readonly [
  infer First extends AnyBinding,
  ...infer Rest extends AnyBinding[],
] ?
    | Exclude<BindingRequires<First>, Available>
    | SetupRequirements<
      Rest,
      Available | BindingName<First>
    >
  : never;

/**
 * Install context values for the duration of an operation.
 *
 * Bindings are evaluated from left to right. An operation-backed binding may
 * therefore depend on values installed by an earlier binding. The operation
 * runs in a child scope, so resources and context changes are cleaned up when
 * it completes, errors, or is halted.
 *
 * @example
 * ```ts
 * import { createContext, provide, run } from "effection";
 *
 * const DatabaseContext = createContext<Database, "database">("database");
 * const LoggerContext = createContext<Logger, "logger">("logger");
 *
 * function* app() {
 *   let database = yield* DatabaseContext.expect();
 *   let logger = yield* LoggerContext.expect();
 *   logger.info(database.query("select 1"));
 * }
 *
 * await run(function* () {
 *   yield* provide(
 *     DatabaseContext.of(database),
 *     LoggerContext.of(logger),
 *     app,
 *   );
 * });
 * ```
 *
 * Providers are evaluated from left to right, so a provider can depend on a
 * context installed by an earlier provider with `Context.from()`.
 *
 * @param bindings context values or operations that produce context values
 * @param operation the operation to run with those values
 * @returns an operation yielding the child operation's result
 * @since 4.1
 */
export function provide<
  const Bindings extends readonly AnyBinding[],
  Child extends Operation<unknown, unknown>,
>(
  ...args: [...bindings: Bindings, operation: () => Child]
): Operation<
  Yielded<Child>,
  | SetupRequirements<Bindings>
  | Exclude<RequirementsOf<Child>, BindingName<Bindings[number]>>
> {
  let bindings = args.slice(0, -1) as unknown as Bindings;
  let operation = args[args.length - 1] as () => Child;

  return scoped(() => {
    return (function* () {
      for (let binding of bindings) {
        if ("operation" in binding) {
          yield* binding.context.set(yield* binding.operation);
        } else {
          yield* binding.context.set(binding.value);
        }
      }
      return yield* operation();
    })() as unknown as Child;
  }) as Operation<
    Yielded<Child>,
    | SetupRequirements<Bindings>
    | Exclude<RequirementsOf<Child>, BindingName<Bindings[number]>>
  >;
}
