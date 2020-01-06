// TypeScript Version: 3.6
declare module "effection" {
  export type Operation = SequenceFn | Sequence | Promise<any> | Controller | Execution<any> | undefined;
  export type SequenceFn = (this: Execution) => Sequence;
  export type Controller = (execution: Execution) => void | (() => void);

  export interface Sequence extends Generator<Operation, any, any> {}

  export interface Execution<T = any> extends PromiseLike<any> {
    id: number;
    resume(result: T): void;
    throw(error: Error): void;
    halt(reason?: any): void;
    catch<R>(fn: (error: Error) => R): Promise<R>;
    finally(fn: () => void): Promise<any>;
    monitor<T>(operation: Operation): Execution<T>;
  }

  export function fork<T>(operation: Operation): Execution<T>;

  export function monitor<T>(operation: Operation): Execution<T>;

  export function timeout(durationMillis: number): Operation;
}
