# Middleware

Type-safe composable middleware for generators and Effection operations

---

Middleware lets you wrap any function with a chain of interceptors that can
inspect arguments, transform return values, or short-circuit execution entirely.
The `combine()` function composes an array of middleware into a single
middleware, executing left-to-right.

Because middleware is generic over its return type, generator functions compose
through `combine()` the same way plain functions do. This means you can build
middleware pipelines where each layer sets up Effection resources, establishes
context, or manages cleanup — and everything below it in the stack inherits that
context automatically.

## Quick Start

```ts
import { combine } from "@effectionx/middleware";
import type { Middleware } from "@effectionx/middleware";
import type { Operation } from "effection";
import { createContext, ensure } from "effection";

type Handler = Middleware<[Request], Operation<Response>>;

const DatabaseConnection = createContext<Connection>("database");

// Each middleware is a generator — it's still running while inner layers execute
const withDatabase: Handler = function* (args, next) {
  const conn = yield* connect(process.env.DATABASE_URL);
  yield* DatabaseConnection.set(conn);
  yield* ensure(function* () {
    yield* conn.close();
  });
  return yield* next(...args);
};

const withTransaction: Handler = function* (args, next) {
  const conn = yield* DatabaseConnection.expect();
  const tx = yield* conn.begin();
  try {
    const response = yield* next(...args);
    yield* tx.commit();
    return response;
  } catch (error) {
    yield* tx.rollback();
    throw error;
  }
};
```

The core handler uses context set up by middleware — but never receives any of
it as parameters:

```ts
function* handleRequest(request: Request): Operation<Response> {
  const conn = yield* DatabaseConnection.expect();
  const posts = yield* conn.query("SELECT * FROM posts");
  return Response.json(posts);
}
```

Compose it all together:

```ts
const handle = combine([withDatabase, withTransaction]);

function* processRequest(request: Request): Operation<Response> {
  return yield* handle([request], handleRequest);
}
```

When `handleRequest` returns (or throws, or is cancelled), the stack unwinds in
reverse: `withTransaction` (commit or rollback) → `withDatabase` (close
connection). Structured concurrency guarantees that no resources leak, even if
the request is cancelled mid-flight.

## Plain Functions

Middleware also works with plain synchronous functions — there's no Effection
dependency. This is useful for argument validation, logging, or result
transformation:

```ts
import { combine } from "@effectionx/middleware";
import type { Middleware } from "@effectionx/middleware";

const logger: Middleware<[number, number], number> = (args, next) => {
  console.log("adding", args);
  const result = next(...args);
  console.log("result", result);
  return result;
};

const doubler: Middleware<[number, number], number> = (args, next) =>
  next(...args) * 2;

const add = combine([logger, doubler]);

add([3, 4], (a, b) => a + b);
// adding [3, 4]
// result 14
// => 14
```

## API

### `Middleware<TArgs, TReturn>`

The type of a single middleware function. It receives the arguments as a tuple
and a `next` function to delegate to the next middleware (or the core function).

```ts
import type { Middleware } from "@effectionx/middleware";

const timer: Middleware<[string], string> = (args, next) => {
  const start = performance.now();
  const result = next(...args);
  console.log(`took ${performance.now() - start}ms`);
  return result;
};
```

A middleware can:

- **Pass through**: call `next(...args)` and return its result
- **Transform arguments**: call `next()` with different arguments
- **Transform the return value**: modify what `next()` returns
- **Short-circuit**: return a value without calling `next()` at all

### `combine(middlewares)`

Compose an array of middleware into a single middleware. Middlewares execute
left-to-right: the first in the array runs outermost.

```ts
import { combine } from "@effectionx/middleware";

const composed = combine([logger, validator, retry]);
const result = composed(["hello"], coreFn);
// Execution: logger → validator → retry → coreFn
```

The returned value is itself a `Middleware`, so it can be nested inside other
`combine()` calls or passed anywhere a middleware is expected.
