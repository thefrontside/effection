// deno-lint-ignore-file no-explicit-any
import type { Computation } from "./deps.ts";

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
 * @example
 * ```js
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
 * @example
 * ```js
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
 * See [Operations guide](https://frontside.com/effection/v3/docs/operations) for more information.
 *
 */
export interface Operation<T> {
  [Symbol.iterator](): Iterator<Instruction, T, any>;
}

/**
 * A value that is both an {@link Operation} _and_ `Promise`.
 *
 * Futures are operations that are implicitly associated with an Effection scope
 * and so they can be freely `await`ed within any async functions. However, they
 * can also be evaluated directly within another operation, so among other
 * things, if the operation resolves synchronously, it will continue within the
 * same tick of the run loop.
 */
export interface Future<T> extends Promise<T>, Operation<T> {}

/**
 * A handle to a concurrently running operation that lets you either use the
 * result of that operation, or shut it down.
 *
 * When it is run or spawned, an operation executes concurrently with
 * the rest of the program. The `Task` is both an {@link Operation} and a
 * `Promise` that lets you consume the result of that operation.
 *
 * @example
 * ```javascript
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
 * {@link spawn()} operation.
 *
 * @example
 * ```javascript
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
 * @example
 * ```javascript
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
 * @example
 * ```javascript
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
 * @see {@link run}
 * @see {@link spawn}
 * @see {@link Scope.run}
 */
export interface Task<T> extends Future<T> {
  /**
   * Interrupt and shut down a running {@link Operation} and all of its
   * children.
   *
   * Any errors raised by the `halt()` operation only represent problems that
   * occured during the teardown of the task. In other words, `halt()` can
   * succeed even if the task failed.
   *
   * @returns a future that only resolves when all shutdown associated with this
   * Task is complete.
   */
  halt(): Future<void>;
}

export type Resolve<T = unknown> = (value: T) => void;

export type Reject = (error: Error) => void;

export type Provide<T> = (value: T) => Operation<void>;

/**
 * A programatic API to interact with an Effection scope from outside of an
 * {@link Operation}.
 *
 * Most often this is used to integrate external APIs with Effection by
 * capturing a `Scope` from a running operation with {@link useScope}, and then
 * using it to call back into itself from a callback.
 *
 * The following example calls into Effection to implement a proxy around a
 * google search by using [express.js](https://expressjs.com).
 *
 * @example
 * ```javascript
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
   * Spawn an {@link Operation} within `Scope`.
   *
   * This is used to create concurrent tasks from _outside_ of a running
   * operation.
   *
   * @param operation - the operation to run
   * @returns a task rep
   */
  run<T>(operation: () => Operation<T>): Task<T>;
  /**
   * Get a {@link Context} value from outside of an operation.
   * @param context - the context to get
   * @returns the value of that context in this scope if it exists
   */
  get<T>(context: Context<T>): T | undefined;

  /**
   * Set the value of a {@link Context} from outside of an operation
   * @param context - the context to set
   * @param value - the value to set for this context
   * @returns - the value that was set
   */
  set<T>(context: Context<T>, value: T): T;
}

/**
 * The Effection equivalent of an [`AsyncIterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols).
 *
 * Like async iterables, streams do not actually have state themselves, but
 * contain the recipe for how to create a {@link Subscription}
 *
 * @see https://frontside.com/effection/docs/collections#stream
 */
export type Stream<T, TReturn> = Operation<Subscription<T, TReturn>>;

/**
 * The Effection equivalent of an [`AsyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator)
 *
 * A subscription acts like a stateful queue that provides a sequence of values
 * via the next() method. Normally a subscription is created via a
 * {@link Stream}.
 *
 * @see https://effection.deno.dev/docs/collections#subscription
 */
export interface Subscription<T, R> {
  next(): Operation<IteratorResult<T, R>>;
}

/**
 * `Context`` defines a value which is in effect for a given scope which is an
 * (action, resource, call, or spawn).
 *
 * When used as an operation, it gets the value of the Context from
 * the current scope. If it has not been set, and there is no default
 * value, then a `MissingContextError` will be raised.
 *
 * Unless a context value is defined for a particular scope, it will inherit
 * its value from its parent scope.
 */
export interface Context<T> extends Operation<T> {
  /**
   * A unique identifier for this context.
   */
  readonly key: string;

  /**
   * The value of the context if has not been defined for the current operation.
   */
  readonly defaultValue?: T;

  /**
   * Set the value of the Context for the current scope.
   */
  set(value: T): Operation<T>;

  /**
   * Get the value of the Context from the current scope. If it has not been
   * set, and there is no default value, then this will return `undefined`.
   */
  get(): Operation<T | undefined>;
}

/* low-level interface Which you probably will not need */

/**
 * @ignore
 */
export type Result<T> = {
  readonly ok: true;
  value: T;
} | {
  readonly ok: false;
  error: Error;
};

/**
 * @ignore
 */
export interface Instruction {
  (frame: Frame): Computation<Result<unknown>>;
}

import type { FrameResult } from "./run/types.ts";

/**
 * @ignore
 */
export interface Frame<T = unknown> extends Computation<FrameResult<T>> {
  id: number;
  context: Record<string, unknown>;
  exited?: true;
  aborted?: boolean;
  getTask(): Task<T>;
  createChild<C>(operation: () => Operation<C>): Frame<C>;
  enter(): void;
  crash(error: Error): Computation<Result<void>>;
  destroy(): Computation<Result<void>>;
}
