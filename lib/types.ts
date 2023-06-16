// deno-lint-ignore-file no-explicit-any
import type { Computation } from "./deps.ts";

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

export interface Scope extends Operation<void> {
  run<T>(operation: () => Operation<T>): Task<T>;
  close(): Future<void>;
}

export type Stream<T, TReturn> = Operation<Subscription<T, TReturn>>;

export interface Subscription<T, R> {
  next(): Operation<IteratorResult<T, R>>;
}

export interface Port<T, R> {
  send(message: T): Operation<void>;
  close(value: R): Operation<void>;
}

export interface Channel<T, TClose> {
  input: Port<T, TClose>;
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
  (frame: Frame, signal: AbortSignal): Computation<Result<unknown>>;
}

/**
 * @ignore
 */
export interface Frame extends Computation<Result<void>> {
  id: number;
  context: Record<string, unknown>;
  createChild(): Frame;
  run<T>(operation: () => Operation<T>): Block<T>;
  crash(error: Error): Computation<Result<void>>;
  destroy(): Computation<Result<void>>;
}

/**
 * @ignore
 */
export type BlockResult<T> =
  | {
    readonly aborted: false;
    result: Result<T>;
  }
  | {
    readonly aborted: true;
    result: Result<T>;
  };

/**
 * @ignore
 */
export interface Block<T = unknown> extends Computation<BlockResult<T>> {
  name: string;
  enter(): void;
  abort(): Computation<Result<void>>;
}
