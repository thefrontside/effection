declare module "effection" {
  export type Operation = SequenceFn | Sequence | Promise<any> | Controller | undefined;
  export type SequenceFn = (this: Execution) => Sequence;
  export type Controller = (execution: Execution) => void | (() => void);

  export interface Sequence extends Generator<Operation, any, any> {}

  export interface Execution<T = any> {
    resume(result: T): void;
    throw(error: Error): void;
    halt(reason?: any): void;
  }

  export function fork<T>(operation: Operation): Execution<T>;

  export function timeout(durationMillis: number): Operation;
}
