// TypeScript Version: 3.7
declare module "effection" {
  type PredicateFn = (value: any) => boolean;
  type AnyTypeName = "undefined" | "object" | "boolean" | "number" | "bigint" | "string" | "symbol" | "function" | "array"
  type PatternMatchObject = { [key: string]: PatternMatchOptions };
  type Primitive = string | boolean | number | bigint | symbol | null | undefined;
  export type PatternMatchOptions = Primitive | PatternMatchObject | PatternMatchOptions[] | PredicateFn

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
    send(message: any): void;
  }

  export function fork<T>(operation: Operation): Execution<T>;

  export function receive(): Controller;
  export function receive(fork: Execution<any>): Controller;
  export function receive(match: PatternMatchOptions): Controller;
  export function receive(fork: Execution<any>, match: PatternMatchOptions): Controller;

  export function any(): PredicateFn;
  export function any(type: AnyTypeName): PredicateFn;

  export function timeout(durationMillis: number): Operation;
}
