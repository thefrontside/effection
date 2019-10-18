declare module "effection" {
  export type Operation = SequenceFn | Promise<any> | Controller | undefined;
  export type SequenceFn = (this: Execution, ...args: any[]) => Sequence;
  export type Sequence = Generator<Operation, any, any>;
  export type Controller = (execution: Execution) => void | (() => void);

  export interface Execution<T = any> {
    resume(result: T): void;
    throw(error: Error): void;
  }

  export function execute<T>(operation: Operation): Execution<T>;
  export function call(operation: Operation, ...args: any[]): Operation;
  export function fork<T>(operation: Operation): Execution<T>;

  export function timeout(durationMillis: number): Operation;
}
