// TypeScript Version: 3.7
declare module "effection" {
  export type Operation = SequenceFn | Sequence | Promise<any> | Controller | undefined;
  export type SequenceFn = () => Sequence;

  export type Controller = (controls: Controls) => void | (() => void);

  export interface Sequence extends Generator<Operation, any, any> {}

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
    resume(result: any): void;
    fail(error: Error): void;
    ensure(hook: (context?: Context) => void): () => void;
    spawn(operation: Operation): Context;
    context: Context;
  }

  export function main(operation: Operation): Context;

  export function fork(operation: Operation): Operation;

  export function join(context: Context): Operation;

  export function timeout(durationMillis: number): Operation;


  // send/receive operations, will probably be moved to library at some point.
  type PredicateFn = (value: any) => boolean;
  type AnyTypeName = "undefined" | "object" | "boolean" | "number" | "bigint" | "string" | "symbol" | "function" | "array"
  type Primitive = string | boolean | number | bigint | symbol | null | undefined;
  interface PatternMatchObject { [key: string]: Pattern }
  export type Pattern = Primitive | PatternMatchObject | Pattern[] | PredicateFn

  export function receive(): Operation;
  export function receive(context: Context): Operation;
  export function receive(pattern: Pattern): Operation;
  export function receive(pattern: Pattern, context: Context): Operation;

  export function any(): PredicateFn;
  export function any(type: AnyTypeName): PredicateFn;

  export function send(message: any): Operation;
  export function send(message: any, context: Context): Operation;
}
