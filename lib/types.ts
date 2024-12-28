import type { Result } from "./result.ts";

/**
 * An `Operation` in Effection describes an abstract computation. An operation
 * does not do anything on its own. Rather, it only describes the steps it will
 * take when it runs.
 *
 * In the Effection world, `Operation` occupies the same position as `Promise`
 * does the world of async/await.
 *
 * An operation can be created with a generator function that only does `yield*`
 * to other operations:
 *
 * ```ts
 * import { sleep } from "effection";

 * function* slow5(seconds) {
 *   yield* sleep(seconds * 1000);
 *   return 5;
 * }
 * ```
 *
 * Operations can also be created using `Symbol.iterator`. The following
 * operation is the same as above:
 *
 * ```ts
 * import { sleep } from "effection";
 *
 * const slow5 = (seconds) => ({
 *   *[Symbol.iterator]() {
 *     yield* sleep(seconds * 1000);
 *     return 5;
 *   }
 * })
 * ```
 *
 * See [Operations guide](https://frontside.com/effection/docs/operations) for more information.
 */
export interface Operation<T> {
  [Symbol.iterator](): Iterator<Effect<unknown>, T, unknown>;
}

/**
 * A value that is both an [Operation](/api/Operation) _and_ `Promise`.
 *
 * Futures are operations that are implicitly associated with an Effection scope
 * and so they can be freely `await`ed within any async functions. However, they
 * can also be evaluated directly within another operation, so among other
 * things, if the operation resolves synchronously, it will continue within the
 * same tick of the run loop.
 */
export interface Future<T> extends Operation<T>, Promise<T> {}

/**
 * A handle to a concurrently running operation that lets you either use the
 * result of that operation, or shut it down.
 *
 * When it is run or spawned, an operation executes concurrently with
 * the rest of the program. The `Task` is both an [Operation](/api/Operation) and a
 * `Promise` that lets you consume the result of that operation.
 *
 * ```ts
 * import { run, sleep } from "effection";
 *
 * let task = run(function*() {
 *   yield* sleep(100);
 *   return "hello world"
 * });
 *
 * console.log(await task); //=> "hello world"
 * ```
 *
 * A task can also be created from within an operation by using the
 * [spawn](spawn) operation.
 *
 * ```ts
 * import { run, spawn, sleep } from "effection";
 *
 * await run(function*() {
 *   let task = yield* spawn(function*() {
 *     yield* sleep(100);
 *     return "hello world";
 *   });
 *   console.log(yield* task;) //=> "hello world"
 * });
 * ```
 *
 * Note tasks are subject to the strict guarantees of structured concurrency
 * and will never outlive their parent. For example, the following spawned task
 * will never log any output to the console.
 *
 * ```ts
 * import { run, spawn, sleep } from "effection";
 *
 * await run(function*() {
 *   yield* spawn(function*() {
 *     yield* sleep(100);
 *     console.log("hello world");
 *   });
 *   // <--- returns here, so spawned task is shut down as it sleeps.
 * });
 * ```
 *
 * See the guide on [Scopes](https://frontside.com/effection/docs/scope) for
 * more detail.
 *
 * If a `Task` is halted before it finishes executing, then consuming it's
 * result is an Error.
 *
 * ```ts
 * import { run, spawn, sleep } from "effection";
 *
 * await run(function*() {
 *  let task = yield* spawn(function*() {
 *    yield* sleep(100);
 *    return "hello world";
 *  });
 *  yield* task.halt();
 *  let output = yield* task; //=> throws Error("halted");
 *  console.log(output);
 * });
 * ```
 *
 * [run](/api/run)
 * [spawn](/api/spawn)
 * [Scope](/api/Scope#run)
 */
export interface Task<T> extends Future<T> {
  /**
   * Interrupt and shut down a running [Operation](/api/Operation) and all of its
   * children.
   *
   * Any errors raised by the `halt()` operation only represent problems that
   * occured during the teardown of the task. In other words, `halt()` can
   * succeed even if the task failed.
   *
   * Task is complete.
   */
  halt(): Future<void>;
}

/**
 * The Effection equivalent of an [`AsyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator)
 *
 * A subscription acts like a stateful queue that provides a sequence of values
 * via the next() method. Normally a subscription is created via a
 * [Stream](/api/Stream).
 *
 * https://effection.deno.dev/docs/collections#subscription
 */
export interface Subscription<T, TDone> {
  next(): Operation<IteratorResult<T, TDone>>;
}

/**
 * The Effection equivalent of an [`AsyncIterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols).
 *
 * Like async iterables, streams do not actually have state themselves, but
 * contain the recipe for how to create a [Subscription](/api/Subscription)
 *
 * https://frontside.com/effection/docs/collections#stream
 */
export type Stream<T, TReturn> = Operation<Subscription<T, TReturn>>;

/**
 * `Context` defines a value which is in effect for a given scope which is an
 * (action, resource, call, or spawn).
 *
 * Unless a context value is defined for a particular scope, it will inherit
 * its value from its parent scope.
 */
export interface Context<T> {
  /**
   * A unique identifier for this context.
   */
  name: string;
  
  /**
   * The value returned by this context when it is not present on a scop.e
   */
  defaultValue?: T;

  /**
   * Read the current value of this context if it exists.
   *
   * Return an operation that yields the current value if it exists, or undefined otherwise.
   * [Scope#get](/api/Scope#get) for reading a context value outside of a running operation
   */
  get(): Operation<T | undefined>;

  /**
   * Set the value of a context on the current scope. It will not effect the value of its
   * containing scope and will only be visible by this scope and its children.
   *
   * [Scope#set](/api/Scope#set) for setting a context value outside of a running operation
   */
  set(value: T): Operation<T>;

  /**
   * Read the current value of the context or fail if it does not exist
   *
   * [Scope#expect](/api/Scope#expect) for reading a required context value outside of a running operation
   */
  expect(): Operation<T>;

  /**
   * Remove a context value from the current scope. This will only effect the current scope and
   * not its parent value.
   */
  delete(): Operation<boolean>;

  /**
   * Evaluate an operation using `value` for the context. Once the operation is completed, the context
   * will be reverted to its original value, or removed if it was not present originally.
   *
   * ```ts
   * let user = yield* login();
   * yield* UserContext.with(user, function*() {
   *   //do stuff
   * })
   * ```
   *
   * Return the result of evaluating the operation.
   */
  with<R>(value: T, operation: (value: T) => Operation<R>): Operation<R>;
}

/**
 * A programatic API to interact with an Effection scope from outside of an
 * [Operation](/api/Operation).
 *
 * Most often this is used to integrate external APIs with Effection by
 * capturing a `Scope` from a running operation with [useScope](/api/useScope), and then
 * using it to call back into itself from a callback.
 *
 * The following example calls into Effection to implement a proxy around a
 * google search by using [express.js](https://expressjs.com).
 *
 * ```ts
 * import { main, useScope, suspend } from "effection";
 * import { express } from "express";
 *
 * await main(function*() {
 *   let scope = yield* useScope();
 *   express().get("/", (req, resp) => {
 *     return scope.run(function*() {
 *       let signal = yield* useAbortSignal();
 *       let response = yield* fetch(`https://google.com?q=${req.params.q}`, { signal });
 *       resp.send(yield* response.text());
 *     });
 *   });
 *   yield* suspend();
 * });
 * ```
 */
export interface Scope {
  /**
   * Run an [Operation](/api/Operation) within `Scope`.
   *
   * This is used to create concurrent tasks from _outside_ of a running
   * operation. To create concurrent tasks from _within_ an already
   * running operation, use [Scope#spawn](/api/Scope#spawn)
   */
  run<T>(operation: () => Operation<T>): Task<T>;

  /**
   * Spawn an [Operation](/api/Operation) within `Scope`.
   *
   * This is used to create concurrent tasks from _within_ a running
   * operation. To create concurrent from outside of Effection, use
   * [Scope#run](/api/Scope#run)
   */
  spawn<T>(operation: () => Operation<T>): Operation<Task<T>>;

  /**
   * Get a [Context](/api/Context) value from outside of an operation.
   */
  get<T>(context: Context<T>): T | undefined;

  /**
   * Set the value of a [Context](/api/Context) from outside of an operation
   */
  set<T>(context: Context<T>, value: T): T;

  /**
   * Get a [Context](/api/Context) value from outside of an operation, and throw
   * a `MissingContextError` if this context is not specified for this scope.
   */
  expect<T>(context: Context<T>): T;

  /**
   * Remove a [Context](/api/Context) value from this scope.
   */
  delete<T>(context: Context<T>): boolean;

  /**
   * Check if scope has its own unique value for `context`.
   *
   * Returns `true` if scope has its own context, `false` if context is not present, or inherited from its parent.
   */
  hasOwn<T>(context: Context<T>): boolean;
}

/**
 * Unwrap the type of an `Operation`.
 * Analogous to the built in [`Awaited`](https://www.typescriptlang.org/docs/handbook/utility-types.html#awaitedtype) type.
 * 
 * ```ts
 * Yielded<Operation<T>> === T
 * ```
 */
export type Yielded<T extends Operation<unknown>> = T extends
  Operation<infer TYield> ? TYield
  : never;

// low-level private apis.

export interface Effect<T> {
  description: string;
  enter(
    resolve: Resolve<Result<T>>,
    routine: Coroutine,
  ): (resolve: Resolve<Result<void>>) => void;
}

export interface Coroutine<T = unknown> {
  scope: Scope;
  data: {
    discard(resolve: Resolve<Result<unknown>>): void;
    iterator: Iterator<Effect<unknown>, T, unknown>;
  };
  next(result: Result<unknown>, subscriber?: Subscriber<T>): () => void;
  return<R>(result: Result<R>, subcriber?: Subscriber<void>): () => void;
}

export interface Subscriber<T> {
  (result: IteratorResult<Result<unknown>, Result<T>>): void;
}

export interface Resolve<T> {
  (value: T): void;
}
