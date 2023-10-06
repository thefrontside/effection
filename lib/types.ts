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

export interface Future<T> extends Promise<T>, Operation<T> {}

export interface Task<T> extends Future<T> {
  halt(): Future<void>;
}

export type Resolve<T = unknown> = (value: T) => void;

export type Reject = (error: Error) => void;

export type Provide<T> = (value: T) => Operation<void>;

export interface Scope {
  run<T>(operation: () => Operation<T>): Task<T>;
  get<T>(context: Context<T>): T | undefined;
  set<T>(context: Context<T>, value: T): T;
}

export type Stream<T, TReturn> = Operation<Subscription<T, TReturn>>;

export interface Subscription<T, R> {
  next(): Operation<IteratorResult<T, R>>;
}

export interface Port<T, R> {
  send(message: T): Operation<void>;
  close(value: R): Operation<void>;
}

/**
 * A broadcast channel that multiple consumers can subscribe to the
 * via same {@link `Stream`}, and messages sent to the channel are
 * received by all consumers. The channel is not buffered, so if there
 * are no consumers, the message is dropped.
 */
export interface Channel<T, TClose> {
  /**
   * The port through which messages to the channel are sent.
   */
  input: Port<T, TClose>;

  /**
   * The stream through which all messages to the channel are read.
   */
  output: Stream<T, TClose>;
}

/**
 * `Context`` defines a value which is in effect for a given scope which is an
 * (action, resource, call, or spawn).
 *
 * When used as an operation, it gets the value of the Context from
 * the current scope. If it has not been set, and there is no default
 * value, then a `MissingContextError` will be raised.
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
  aborted?: boolean;
  getTask(): Task<T>;
  createChild<C>(operation: () => Operation<C>): Frame<C>;
  enter(): void;
  crash(error: Error): Computation<Result<void>>;
  destroy(): Computation<Result<void>>;
}
