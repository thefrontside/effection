// TypeScript Version: 3.6
declare module "effection" {
  export type Operation = OperationFn | Sequence | Promise<any> | Controller | undefined;

  type OperationFn = () => Operation;

  type Controller = (controls: Controls) => void | (() => void);

  interface Sequence extends Generator<Operation, any, any> {}

  export interface Context extends PromiseLike<any> {
    id: number;
    parent?: Context;
    result?: any;
    halt(reason?: any): void;
    catch<R>(fn: (error: Error) => R): Promise<R>;
    finally(fn: () => void): Promise<any>;
  }

  export interface Controls {
    id: number;
    resume(result?: any): void;
    fail(error: Error): void;
    ensure(hook: (context?: Context) => void): () => void;
    spawn(operation: Operation): Context;
    context: Context;
  }

  export function main(operation: Operation): Context;

  export function fork(operation: Operation): Operation;

  export function join(context: Context): Operation;

  export function timeout(durationMillis: number): Operation;
}
