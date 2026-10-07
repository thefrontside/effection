import { all, createContext, provide, resource } from "../mod.ts";
import type { Operation, Provide, Yielded } from "../mod.ts";
import { describe, expectType, it } from "./suite.ts";

describe("typed context operations", () => {
  it("infers requirements through delegated yields", () => {
    interface Database {
      query(sql: string): string;
    }

    interface Logger {
      info(message: string): void;
    }

    let DatabaseContext = createContext<Database, "database">("database");
    let LoggerContext = createContext<Logger, "logger">("logger");

    function* query(): Operation<string, "database"> {
      return (yield* DatabaseContext.expect()).query("select 1");
    }

    function* app() {
      yield* LoggerContext.expect();
      return yield* query();
    }

    expectType<Operation<string, "database">>(query());
    expectType<Operation<string, "database" | "logger">>(app());
    expectType<string>(null as unknown as Yielded<ReturnType<typeof app>>);

    // @ts-expect-error query() requires database, not logger.
    expectType<Operation<string, "logger">>(query());
  });

  it("does not require contexts for get or defaults", () => {
    let OptionalContext = createContext<string, "optional">("optional");
    let DefaultContext = createContext<string, "default">("default", "test");

    function* readOptional() {
      return yield* OptionalContext.get();
    }

    function* readDefault() {
      return yield* DefaultContext.expect();
    }

    expectType<Operation<string | undefined, never>>(readOptional());
    expectType<Operation<string, never>>(readDefault());
  });

  it("discharges a requirement with with", () => {
    interface Database {
      query(): string;
    }

    interface Logger {
      info(message: string): void;
    }

    let DatabaseContext = createContext<Database, "database">("database");
    let LoggerContext = createContext<Logger, "logger">("logger");

    function* app() {
      let database = yield* DatabaseContext.expect();
      yield* LoggerContext.expect();
      return database.query();
    }

    function* localApp() {
      return yield* DatabaseContext.with({ query: () => "local" }, app);
    }

    expectType<Operation<string, "logger">>(localApp());
  });
});

describe("typed context bindings", () => {
  it("creates checked value and operation bindings", () => {
    interface Database {
      query(): string;
    }

    let DatabaseContext = createContext<Database, "database">("database");
    let ConfigContext = createContext<string, "config">("config");
    let valueBinding = DatabaseContext.of({ query: () => "value" });

    let operationBinding = DatabaseContext.from(
      (function* () {
        let config = yield* ConfigContext.expect();
        return { query: () => config };
      })(),
    );

    expectType<typeof valueBinding>(valueBinding);
    expectType<typeof operationBinding>(operationBinding);

    // @ts-expect-error the value must satisfy DatabaseContext.
    DatabaseContext.of({ invalid: true });

    DatabaseContext.from(
      // @ts-expect-error the provider must yield a Database.
      (function* () {
        return "not a database";
      })(),
    );
  });

  it("runs providers from left to right", () => {
    interface Database {
      query(): string;
    }

    interface Logger {
      info(message: string): void;
    }

    let ConfigContext = createContext<string, "config">("config");
    let DatabaseContext = createContext<Database, "database">("database");
    let LoggerContext = createContext<Logger, "logger">("logger");

    let database = DatabaseContext.from(
      (function* () {
        let config = yield* ConfigContext.expect();
        return { query: () => config };
      })(),
    );

    let logger = LoggerContext.from(
      (function* () {
        let config = yield* ConfigContext.expect();
        return { info: () => config };
      })(),
    );

    function* app() {
      yield* DatabaseContext.expect();
      yield* LoggerContext.expect();
    }

    expectType<Operation<void, "config">>(
      provide(ConfigContext.of("test"), database, logger, app),
    );

    let incomplete = provide(database, ConfigContext.of("test"), logger, app);
    // @ts-expect-error database runs before config and still requires config.
    expectType<Operation<void, never>>(incomplete);
  });
});

describe("typed context composition", () => {
  it("keeps resource setup requirements", () => {
    interface Database {
      query(): string;
    }

    let ConfigContext = createContext<string, "config">("config");
    let DatabaseContext = createContext<Database, "database">("database");

    let database = resource(function* (
      provide: Provide<Database>,
    ): Operation<void, "config"> {
      let config = yield* ConfigContext.expect();
      yield* provide({ query: () => config });
    });

    function* app() {
      return (yield* DatabaseContext.expect()).query();
    }

    expectType<Operation<string, "config">>(
      provide(ConfigContext.of("test"), DatabaseContext.from(database), app),
    );
  });

  it("preserves requirements through all", () => {
    interface Database {
      query(): string;
    }

    interface Logger {
      info(message: string): void;
    }

    let DatabaseContext = createContext<Database, "database">("database");
    let LoggerContext = createContext<Logger, "logger">("logger");

    function* query() {
      return (yield* DatabaseContext.expect()).query();
    }

    expectType<Operation<[string, Logger], "database" | "logger">>(
      all([query(), LoggerContext.expect()] as const),
    );
  });

  it("keeps legacy annotations valid", () => {
    let Context = createContext<string, "value">("value");

    function* legacy(): Operation<string> {
      return (yield* Context.get()) ?? "fallback";
    }

    expectType<Operation<string>>(legacy());
  });
});
