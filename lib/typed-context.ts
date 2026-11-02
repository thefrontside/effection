import { all as coreAll } from "./all.ts";
import { createContext as createCoreContext } from "./context.ts";
import { resource as coreResource } from "./resource.ts";
import { scoped as coreScoped } from "./scoped.ts";
import type {
  Effect as CoreEffect,
  Operation as CoreOperation,
} from "./types.ts";

/**
 * An operation whose type carries the names of contexts it requires.
 *
 * @experimental
 */
export interface Operation<T, Requires = never> extends CoreOperation<T> {
  [Symbol.iterator](): Iterator<Effect<unknown, Requires>, T, unknown>;
}

/** @experimental */
export interface Effect<T, Requires = never> extends CoreEffect<T> {
  readonly __requirements?: Requires;
}

/** @experimental */
export type Yielded<T extends CoreOperation<unknown>> = T extends
  CoreOperation<infer Value> ? Value : never;

type EffectRequirements<Effect> = Effect extends {
  readonly __requirements?: infer Requires;
} ? unknown extends Requires ? never : Exclude<Requires, undefined>
  : never;

/** @experimental */
export type RequirementsOf<T> = T extends Iterable<infer Effect>
  ? EffectRequirements<Effect>
  : never;

/** @experimental */
export interface ValueBinding<Value, Name extends string> {
  readonly context: Context<Value, Name>;
  readonly value: Value;
}

/** @experimental */
export interface OperationBinding<
  Value,
  Name extends string,
  Provider extends Operation<Value, unknown>,
> {
  readonly context: Context<Value, Name>;
  readonly operation: Provider;
}

/** @experimental */
export type ContextBinding<
  Value,
  Name extends string,
  Provider extends Operation<Value, unknown> = Operation<Value, never>,
> =
  | ValueBinding<Value, Name>
  | OperationBinding<Value, Name, Provider>;

/**
 * A context with a literal identity used to track operation requirements.
 *
 * @experimental
 */
export interface Context<
  Value,
  Name extends string = string,
  HasDefault extends boolean = false,
> {
  readonly name: Name;
  readonly defaultValue?: Value;
  get(): Operation<Value | undefined, never>;
  set(value: Value): Operation<Value, never>;
  expect(): Operation<Value, HasDefault extends true ? never : Name>;
  delete(): Operation<boolean, never>;
  with<Child extends Operation<unknown, unknown>>(
    value: Value,
    operation: (value: Value) => Child,
  ): Operation<Yielded<Child>, Exclude<RequirementsOf<Child>, Name>>;
  of(value: Value): ContextBinding<Value, Name>;
  from<Provider extends Operation<Value, unknown>>(
    provider: Provider,
  ): ContextBinding<Value, Name, Provider>;
}

/**
 * Create a context whose literal name identifies requirements in operation
 * types.
 *
 * @experimental
 */
export function createContext<Value, const Name extends string = string>(
  name: Name,
): Context<Value, Name, false>;
export function createContext<Value, const Name extends string = string>(
  name: Name,
  defaultValue: Value,
): Context<Value, Name, true>;
export function createContext<Value, const Name extends string = string>(
  name: Name,
  defaultValue?: Value,
): Context<Value, Name, boolean> {
  let core = arguments.length === 1
    ? createCoreContext<Value>(name)
    : createCoreContext<Value>(name, defaultValue as Value);

  return {
    name,
    defaultValue,
    get: () => core.get() as Operation<Value | undefined, never>,
    set: (value) => core.set(value) as Operation<Value, never>,
    expect: () => core.expect() as Operation<Value, Name>,
    delete: () => core.delete() as Operation<boolean, never>,
    with<Child extends Operation<unknown, unknown>>(
      value: Value,
      operation: (value: Value) => Child,
    ): Operation<Yielded<Child>, Exclude<RequirementsOf<Child>, Name>> {
      return core.with(value, operation) as Operation<
        Yielded<Child>,
        Exclude<RequirementsOf<Child>, Name>
      >;
    },
    of(value: Value): ContextBinding<Value, Name> {
      return { context: this, value };
    },
    from<Provider extends Operation<Value, unknown>>(
      operation: Provider,
    ): ContextBinding<Value, Name, Provider> {
      return { context: this, operation };
    },
  };
}

type AnyBinding = ContextBinding<
  unknown,
  string,
  Operation<unknown, unknown>
>;

type BindingRequirements<Binding> = Binding extends ContextBinding<
  unknown,
  string,
  infer Provider
> ? RequirementsOf<Provider>
  : never;

type BindingName<Binding> = Binding extends ContextBinding<
  unknown,
  infer Name,
  Operation<unknown, unknown>
> ? Name
  : never;

type SetupRequirements<
  Bindings extends readonly AnyBinding[],
  Available extends string = never,
> = Bindings extends readonly [
  infer First extends AnyBinding,
  ...infer Rest extends AnyBinding[],
] ?
    | Exclude<BindingRequirements<First>, Available>
    | SetupRequirements<Rest, Available | BindingName<First>>
  : never;

/**
 * Install context values for the duration of an operation.
 *
 * Bindings are evaluated from left to right. An operation-backed binding may
 * depend on values installed by an earlier binding.
 *
 * @example
 * ```ts
 * import { createContext, provide } from "effection/experimental";
 *
 * let Database = createContext<Database, "database">("database");
 * let Logger = createContext<Logger, "logger">("logger");
 *
 * function* app() {
 *   let database = yield* Database.expect();
 *   let logger = yield* Logger.expect();
 *   logger.info(database.query("select 1"));
 * }
 *
 * yield* provide(
 *   Database.of(database),
 *   Logger.of(logger),
 *   app,
 * );
 * ```
 *
 * @experimental
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

  return coreScoped(function* () {
    for (let binding of bindings) {
      if ("operation" in binding) {
        yield* binding.context.set(yield* binding.operation);
      } else {
        yield* binding.context.set(binding.value);
      }
    }
    return yield* operation();
  }) as Operation<
    Yielded<Child>,
    | SetupRequirements<Bindings>
    | Exclude<RequirementsOf<Child>, BindingName<Bindings[number]>>
  >;
}

/** @experimental */
export interface Provide<Value> {
  (value: Value): Operation<void, never>;
}

/** @experimental */
export function resource<
  Value,
  Body extends Operation<void, unknown> = Operation<void>,
>(
  operation: (provide: Provide<Value>) => Body,
): Operation<Value, RequirementsOf<Body>> {
  return coreResource((provide) => {
    return operation((value) => provide(value) as Operation<void, never>);
  }) as Operation<Value, RequirementsOf<Body>>;
}

/** @experimental */
export function scoped<Child extends Operation<unknown, unknown>>(
  operation: () => Child,
): Operation<Yielded<Child>, RequirementsOf<Child>> {
  return coreScoped(operation) as Operation<
    Yielded<Child>,
    RequirementsOf<Child>
  >;
}

/** @experimental */
export function all<
  Operations extends readonly Operation<unknown, unknown>[] | [],
>(operations: Operations): Operation<
  { -readonly [Index in keyof Operations]: Yielded<Operations[Index]> },
  RequirementsOf<Operations[number]>
> {
  return coreAll(operations) as Operation<
    { -readonly [Index in keyof Operations]: Yielded<Operations[Index]> },
    RequirementsOf<Operations[number]>
  >;
}
