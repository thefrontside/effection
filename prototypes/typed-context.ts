/**
 * PROTOTYPE: inferred context requirements for Effection operations.
 *
 * Question: can delegated `yield* Context.expect()` calls accumulate context
 * requirements, and can `Context.with()` discharge them, without changing the
 * runtime representation of an Operation?
 *
 * Run with: deno task prototype:typed-context
 *
 * This is deliberately throwaway type-model code, not an implementation.
 */

declare const requirement: unique symbol;
declare const bindingRequirement: unique symbol;

interface Effect<Requires extends string = never> {
  readonly [requirement]?: Requires;
}

interface Operation<Value, Requires extends string = never> {
  [Symbol.iterator](): Iterator<Effect<Requires>, Value, unknown>;
}

interface ContextBinding<
  Name extends string,
  Requires extends string = never,
> {
  readonly name: Name;
  readonly [bindingRequirement]?: Requires;
}

type Yielded<T> = T extends Operation<infer Value, string> ? Value : never;

type RequirementsOf<T> = T extends {
  [Symbol.iterator](): Iterator<infer YieldedInstruction, unknown, unknown>;
} ? YieldedInstruction extends Effect<infer Requires> ? Requires
  : never
  : never;

interface Context<Value, Name extends string, HasDefault extends boolean> {
  readonly name: Name;
  of(value: Value): ContextBinding<Name, never>;
  from<Provider extends Operation<Value, string>>(
    provider: Provider,
  ): ContextBinding<Name, RequirementsOf<Provider>>;
  get(): Operation<Value | undefined>;
  expect(): Operation<Value, HasDefault extends true ? never : Name>;
  with<Child extends Operation<unknown, string>>(
    value: Value,
    operation: () => Child,
  ): Operation<Yielded<Child>, Exclude<RequirementsOf<Child>, Name>>;
}

declare function createContext<Value, const Name extends string>(
  name: Name,
): Context<Value, Name, false>;

declare function createContext<Value, const Name extends string>(
  name: Name,
  value: Value,
): Context<Value, Name, true>;

interface Provide<Value> {
  (value: Value): Operation<void>;
}

declare function resource<
  Value,
  Body extends Operation<void, string>,
>(
  operation: (provide: Provide<Value>) => Body,
): Operation<Value, RequirementsOf<Body>>;

interface Database {
  query(sql: string): string[];
}

interface Logger {
  info(message: string): void;
}

const DatabaseContext = createContext<Database, "database">("database");
const LoggerContext = createContext<Logger, "logger">("logger");
const ClockContext = createContext<() => Date, "clock">(
  "clock",
  () => new Date(),
);

function* users() {
  let database = yield* DatabaseContext.expect();
  let logger = yield* LoggerContext.expect();
  let now = yield* ClockContext.expect();
  logger.info(`loading users at ${now().toISOString()}`);
  return database.query("select * from users");
}

type Equal<Left, Right> = (<T>() => T extends Left ? 1 : 2) extends
  (<T>() => T extends Right ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

// Delegated yields accumulate requirements; contexts with defaults add none.
type UsersRequireDatabaseAndLogger = Assert<
  Equal<RequirementsOf<ReturnType<typeof users>>, "database" | "logger">
>;

const withDatabase = DatabaseContext.with(
  { query: () => [] },
  users,
);

// A provider removes its own name and preserves every other requirement.
type WithDatabaseStillRequiresLogger = Assert<
  Equal<RequirementsOf<typeof withDatabase>, "logger">
>;

const complete = LoggerContext.with(
  { info: () => {} },
  () => DatabaseContext.with({ query: () => [] }, users),
);

type FullyProvidedOperationHasNoRequirements = Assert<
  Equal<RequirementsOf<typeof complete>, never>
>;

type BindingNames<Bindings extends readonly ContextBinding<string, string>[]> =
  Bindings[number]["name"];

type SetupRequirements<
  Bindings extends readonly ContextBinding<string, string>[],
  Available extends string = never,
> = Bindings extends readonly [
  infer First extends ContextBinding<string, string>,
  ...infer Rest extends readonly ContextBinding<string, string>[],
]
  ? First extends ContextBinding<infer Name, infer Requires>
    ? Exclude<Requires, Available> | SetupRequirements<Rest, Available | Name>
  : never
  : never;

declare function withContexts<
  const Bindings extends readonly ContextBinding<string, string>[],
  Child extends Operation<unknown, string>,
>(
  ...args: [...bindings: Bindings, operation: () => Child]
): Operation<
  Yielded<Child>,
  | SetupRequirements<Bindings>
  | Exclude<RequirementsOf<Child>, BindingNames<Bindings>>
>;

const variadicComplete = withContexts(
  DatabaseContext.of({ query: () => [] }),
  LoggerContext.of({ info: () => {} }),
  users,
);

type VariadicProvidersDischargeRequirements = Assert<
  Equal<RequirementsOf<typeof variadicComplete>, never>
>;

interface Config {
  databaseUrl: string;
}

const ConfigContext = createContext<Config, "config">("config");

function* loadConfig() {
  let now = yield* ClockContext.expect();
  return { databaseUrl: `database://${now().getTime()}` };
}

function* connectDatabase() {
  let config = yield* ConfigContext.expect();
  return {
    query: (_sql: string) => [config.databaseUrl],
  } satisfies Database;
}

function* createLogger() {
  let config = yield* ConfigContext.expect();
  return {
    info: (_message: string) => {
      config.databaseUrl;
    },
  } satisfies Logger;
}

// Providers run left-to-right. Each operation-backed provider can use every
// context established before it. The child runs after every provider.
const operationBackedProviders = withContexts(
  ConfigContext.from(loadConfig()),
  DatabaseContext.from(connectDatabase()),
  LoggerContext.from(createLogger()),
  users,
);

type ProviderDependenciesCanComeFromEarlierBindings = Assert<
  Equal<RequirementsOf<typeof operationBackedProviders>, never>
>;

// Reversing dependent providers is observably different: Config is not
// available while connectDatabase runs, so it remains an external requirement.
const incorrectlyOrderedProviders = withContexts(
  DatabaseContext.from(connectDatabase()),
  ConfigContext.from(loadConfig()),
  LoggerContext.from(createLogger()),
  users,
);

type LaterBindingsDoNotSatisfyEarlierProviders = Assert<
  Equal<RequirementsOf<typeof incorrectlyOrderedProviders>, "config">
>;

// @ts-expect-error the database provider still needs an outer "config"
run(() => incorrectlyOrderedProviders);

interface ManagedDatabase extends Database {
  close(): void;
}

function openManagedDatabase(config: Config): ManagedDatabase {
  return {
    query: (_sql: string) => [config.databaseUrl],
    close: () => {},
  };
}

function databaseResource() {
  return resource(function* (provide: Provide<ManagedDatabase>) {
    let config = yield* ConfigContext.expect();
    let database = openManagedDatabase(config);

    try {
      yield* provide(database);
    } finally {
      database.close();
    }
  });
}

type ResourceSetupCarriesItsRequirements = Assert<
  Equal<RequirementsOf<ReturnType<typeof databaseResource>>, "config">
>;

const resourceBackedProvider = withContexts(
  ConfigContext.of({ databaseUrl: "database://localhost" }),
  DatabaseContext.from(databaseResource()),
  LoggerContext.of({ info: () => {} }),
  users,
);

type EarlierBindingsSatisfyResourceSetup = Assert<
  Equal<RequirementsOf<typeof resourceBackedProvider>, never>
>;

// @ts-expect-error a binding's value is checked by its context
DatabaseContext.of({ info: () => {} });

type ValuesOf<Operations extends readonly Operation<unknown, string>[]> = {
  -readonly [Index in keyof Operations]: Yielded<Operations[Index]>;
};

declare function all<Operations extends readonly Operation<unknown, string>[]>(
  operations: Operations,
): Operation<ValuesOf<Operations>, RequirementsOf<Operations[number]>>;

const combined = all([users(), LoggerContext.expect()] as const);
type CombinatorsPreserveTheRequirementUnion = Assert<
  Equal<RequirementsOf<typeof combined>, "database" | "logger">
>;

declare function run<Value, Requires extends never>(
  operation: () => Operation<Value, Requires>,
): Promise<Value>;

run(() => complete);

// @ts-expect-error users requires the "database" and "logger" contexts
run(users);

// This is the migration trap: an explicit one-parameter annotation fixes the
// requirement parameter at its default rather than inferring it from the body.
function* _misleadingAnnotation(): Operation<string[]> {
  // @ts-expect-error an explicit Operation<T> cannot infer a missing generic
  return yield* users();
}
