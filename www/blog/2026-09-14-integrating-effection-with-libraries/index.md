---
title: "Integrating Effection with Libraries"
description: "How to integrate Effection with non-Effection code using a small scope bridge for callbacks and Promises."
author: "Joshua Amaju"
tags: ["effection", "integration", "structured concurrency"]
image: "integrating-effection-with-libraries.svg"
---

You do not need an Effection-specific adapter for every library you use. You
need a small boundary between the library's callbacks and your Effection
operations.

Here is the pattern I use on the server.

## Let Effection own the application

I start by making the application itself a [resource](/api/v4/resource).
Connections, workers, and other long-lived dependencies acquired by that
resource belong to the application's scope. They stay available while the
application is running and are cleaned up when that scope ends.

A database connection is a good example:

```ts
import { ensure, resource, until } from "effection";

function database() {
  return resource(function* (provide) {
    const connection = createConnection();

    yield* ensure(function* () {
      yield* until(connection.close());
    });

    yield* until(connection.verify());
    yield* provide(connection);
  });
}
```

The resource describes the whole lifetime of the connection. If application
startup fails, or the process begins a graceful shutdown, the same cleanup path
runs. Because closing the connection is asynchronous, `ensure()` registers an
operation that Effection observes during teardown.

## Re-enter the Effection scope from callbacks

Consider a [Hono](https://hono.dev/) route. Hono owns the callback and expects
it to return a Promise. It may invoke that callback long after the code that
registered the route has finished, so the callback cannot simply `yield*` an
operation.

While building the application, I capture its Effection scope and create one
bridge:

```ts
import { type Operation, useScope } from "effection";

type RunOperation = <T>(operation: () => Operation<T>) => Promise<T>;

function* useOperationRunner(): Operation<RunOperation> {
  const scope = yield* useScope();

  return async function runOperation<T>(
    operation: () => Operation<T>,
  ): Promise<T> {
    const outcome = await scope.run(function* () {
      try {
        return { ok: true, value: yield* operation() } as const;
      } catch (error) {
        return { ok: false, error } as const;
      }
    });

    if (!outcome.ok) {
      throw outcome.error;
    }

    return outcome.value;
  };
}
```

The framework still gets the Promise it expects. Inside that Promise, the
application gets structured concurrency, context, and lifetimes managed by the
captured parent scope.

The `try/catch` inside `scope.run()` is deliberate. An uncaught error from a
child operation also fails its parent scope. That is useful during startup: if a
database resource fails, the application should fail too. It is not useful at an
external callback boundary. A bad HTTP request should reject Hono's handler
Promise, not tear down the application that registered it.

The runner catches the error _inside_ the child and turns it into an ordinary
value. Once `scope.run()` settles and execution is outside Effection again, it
throws the captured error. Adding `.catch()` to the returned Promise would be
too late; the child would already have failed its parent.

## Tie request work to the request

Re-entering the application scope does not automatically tie an operation to an
HTTP request. The application is deliberately longer-lived. For work that only
exists to produce a response, race it against the request's `AbortSignal`:

```ts
import { once, race } from "effection";

app.get("/reports/:id", async (ctx) => {
  const signal = ctx.req.raw.signal;

  const report = await runOperation(function* () {
    signal.throwIfAborted();

    return yield* race([
      buildReport({ id: ctx.req.param("id") }),
      (function* requestCancelled() {
        yield* once(signal, "abort");
        throw signal.reason ?? new Error("HTTP request cancelled");
      })(),
    ]);
  });

  return ctx.json(report);
});
```

If `buildReport()` finishes first, Effection halts the branch waiting for
`abort` and removes its listener. If the client disconnects first, the abort
branch throws and Effection halts `buildReport()` and all of its children.

The same bridge works for a [BullMQ](https://docs.bullmq.io/) processor or any
other Promise callback. The library owns delivery, retries, and its public API;
Effection owns the in-process lifetime of the operation and everything it
starts. Keep that Promise callback thin, enter the scope once, and express the
rest of the workflow in Effection.
