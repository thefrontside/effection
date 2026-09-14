# Typed context provisioning examples

> **Prototype:** this records the proposed semantics; it is not production API.

The question is how literal values, operation-backed providers, provider
dependencies, overrides, resources, failures, and concurrency compose without
nested `Context.with()` callbacks.

## Proposed declarations

```ts
const ConfigContext = createContext<Config, "config">("config");
const DatabaseContext = createContext<Database, "database">("database");
const LoggerContext = createContext<Logger, "logger">("logger");

// Its default means that expect() has no external requirement.
const ClockContext = createContext<Clock, "clock">("clock", systemClock);
```

`Context.of(value)` describes an already-available value. `Context.from(op)`
describes an operation that must be evaluated to obtain the value. Keeping these
separate avoids ambiguity when the context value is itself an Operation.

## Consumers

```ts
function* app() {
  let database = yield* DatabaseContext.expect();
  let logger = yield* LoggerContext.expect();
  let optionalConfig = yield* ConfigContext.get();
  let clock = yield* ClockContext.expect();

  logger.info(String(clock.now()));
  return database.query(optionalConfig?.query ?? "select 1");
}
```

The inferred requirements are `"database" | "logger"`. `get()` is optional, and
`ClockContext` has a default, so neither contributes a requirement. Requirements
of operations delegated to by `app()` are included transitively.

## Literal providers

```ts
yield * withContexts(
  DatabaseContext.of(database),
  LoggerContext.of(logger),
  app,
);
```

The resulting operation has no requirements. Values passed to `of()` are checked
against their context.

## Operation-backed providers

```ts
function* loadConfig() {
  return { databaseUrl: Deno.env.get("DATABASE_URL")! };
}

function* connectDatabase() {
  let config = yield* ConfigContext.expect();
  return yield* openDatabase(config.databaseUrl);
}

yield * withContexts(
  ConfigContext.from(loadConfig()),
  DatabaseContext.from(connectDatabase()),
  LoggerContext.of(logger),
  app,
);
```

Providers are evaluated sequentially from left to right. After a provider
finishes, its value is installed before the next provider begins. Therefore
`connectDatabase()` can require `ConfigContext` in this ordering.

The final `app` argument is still a function so its invocation also occurs after
every context has been installed.

### Promise-backed setup

`from()` accepts an Operation, not a Promise. Promises are eager, so
constructing one before `withContexts()` would start it before earlier bindings
were installed. Start promise work from inside a provider operation instead:

```ts
function* connectDatabase() {
  let config = yield* ConfigContext.expect();
  return yield* call(() => connectDatabaseAsync(config.databaseUrl));
}

DatabaseContext.from(connectDatabase());
```

Here `connectDatabaseAsync()` is called only when the provider operation is
interpreted. Creating a promise first and passing `until(promise)` merely adapts
already-started work; it does not restore provider ordering or cancellability.

## Incorrect or externally satisfied ordering

```ts
let boot = withContexts(
  DatabaseContext.from(connectDatabase()), // requires "config" here
  ConfigContext.from(loadConfig()),
  LoggerContext.of(logger),
  app,
);
```

The later config provider cannot satisfy the earlier database provider. Thus
`boot` still requires `"config"`, and a top-level `run(() => boot)` is rejected.
It is valid when config is inherited from an outer scope; the later binding then
overrides it for `app`:

```ts
yield * ConfigContext.with(outerConfig, () => boot);
```

This is deliberately ordered rather than automatically topologically sorted.
Source order remains runtime order, and cycles remain visible as unmet outer
requirements.

## Provider decoration and duplicate bindings

A later provider may consume and replace an earlier value for the same context.
This makes duplicate bindings useful for decorators rather than inherently an
error:

```ts
function* instrumentDatabase() {
  let database = yield* DatabaseContext.expect();
  return instrument(database);
}

yield * withContexts(
  DatabaseContext.of(database),
  DatabaseContext.from(instrumentDatabase()),
  LoggerContext.of(logger),
  app,
);
```

`app` sees the instrumented database. Without the first binding,
`instrumentDatabase()` requires an inherited `"database"`.

## Resource providers and teardown

```ts
function connectDatabase(): Operation<Database, "config"> {
  return resource(function* (provide) {
    let config = yield* ConfigContext.expect();
    let database = yield* openDatabase(config.databaseUrl);
    yield* ensure(() => closeDatabase(database));
    yield* provide(database);
  });
}

yield * withContexts(
  ConfigContext.of(config),
  DatabaseContext.from(connectDatabase()),
  LoggerContext.of(logger),
  app,
);
```

`withContexts()` must evaluate its providers and child inside `scoped()`. That
keeps a resource provider alive for the whole child operation and guarantees
teardown when the child returns, errors, or is halted. Providers are acquired
left-to-right; their registered cleanup runs in reverse registration order.

If a provider fails, later providers and `app` never start, and the scope tears
down everything already acquired.

## Context values that are Operations

The separate methods make intent explicit when `T` itself is an Operation:

```ts
const JobContext = createContext<Operation<void>, "job">("job");

JobContext.of(job); // install the Operation as the context value
JobContext.from(loadJob()); // run loadJob() to obtain the Operation value
```

Overloading `of()` for both meanings would make this case ambiguous.

## Nested provisioning and overrides

```ts
yield * withContexts(
  LoggerContext.of(productionLogger),
  function* () {
    yield* withContexts(
      LoggerContext.of(requestLogger),
      app,
    );
  },
);
```

Children inherit outer bindings. Inner bindings override them only within the
inner `withContexts()` scope. References returned from that scope do not extend
the binding or resource lifetime.

## Independent providers and concurrency

`withContexts()` is sequential by default even when providers happen to be
independent. This gives one predictable rule and permits dependencies between
adjacent providers. It should not silently switch between sequential and
concurrent execution based on inferred types.

If concurrent provider acquisition proves necessary, it should be explicit in a
separate combinator or provider group, with the rule that members of the same
group cannot consume one another. Subsequent groups may consume all values from
earlier groups.

## Direct `set()`

```ts
yield * DatabaseContext.set(database);
yield * app();
```

This works at runtime, but basic generator inference cannot prove that `set()`
happens before every use. Treating all sets as providers would incorrectly
accept an `expect()` that appears before its corresponding set. Therefore
`withContexts()` is the statically checked provisioning form; direct `set()`
remains an imperative escape hatch.

## Entry points and concurrency combinators

- `all()` and `race()` union the requirements of their members.
- `spawn(child)` requires the child's contexts when the spawn operation starts.
- The resulting `Task` has no requirements because it is already running in its
  owner scope.
- `run()` and `main()` reject operations with unmet requirements.
- `Scope.run()` is an integration escape hatch unless `Scope` itself later gains
  an available-context type parameter.

## Runtime outline

Conceptually, `withContexts()` is one scoped, sequential operation:

```ts
return scoped(function* () {
  for (let binding of bindings) {
    let value = binding.kind === "value"
      ? binding.value
      : yield* binding.operation;
    yield* binding.context.set(value);
  }

  return yield* child();
});
```

The production implementation would use typed internal descriptors rather than
the simplified union shown here.
