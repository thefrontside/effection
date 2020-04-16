// TypeScript Version: 3.7
declare module "effection" {
  export type ContextState = 'unstarted' | 'running' | 'waiting' | 'completed' | 'errored' | 'halted';
  export type Operation<T = any> = undefined | OperationFn<T> | Sequence<T> | PromiseLike<T> | Controller<T>;

  type OperationFn<T = any> = () => Operation<T>;

  type Controller<T = any> = (controls: Controls<T>) => void | (() => void);

  interface Sequence<T = any> extends Generator<Operation<any>, T, any> {}

  export interface Context<T = any> extends PromiseLike<T> {
    id: number;
    state: ContextState;
    parent?: Context<any>;
    result?: any;
    halt(reason?: any): void;
    catch<R>(fn: (error: Error) => R): Promise<R>;
    finally(fn: () => void): Promise<undefined>;
  }

  export interface Controls<T = any> {
    id: number;
    resume(result?: T): void;
    fail(error: Error): void;
    ensure(hook: (context?: Context<T>) => void): () => void;
    spawn<C>(operation: Operation<C>): Context<C>;
    fork<C>(operation: Operation<C>): Context<C>;
    context: Context<T>;
  }

  export function main<T>(operation: Operation<T>): Context<T>;

  export function fork<T>(operation: Operation<T>): Operation<Context<T>>;

  export function join<T>(context: Context<T>): Operation<T>;

  export function spawn<T>(operation: Operation<T>): Operation<T>;

  export function resource<T extends Object>(object: T, operation: Operation<void>): Operation<T>;

  export function monitor<T>(operation: Operation<T>): Operation<T>;

  export function timeout(durationMillis: number): Operation<void>;

  export function contextOf(object: Object): Context<any> | undefined;

  export function Deferred<T>(): Deferred<T>;

  export interface Deferred<T> {
    resolve(value: T): void;
    reject(error: Error): void;
    promise: Promise<T>;
  }
}
