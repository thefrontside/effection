import { createContext, type Operation } from "effection";

export type Around<A> = {
  [K in keyof Operations<A>]: A[K] extends
    (...args: infer TArgs) => infer TReturn ? Middleware<TArgs, TReturn>
    : Middleware<[], A[K]>;
};

export interface Middleware<TArgs extends unknown[], TReturn> {
  (args: TArgs, next: (...args: TArgs) => TReturn): TReturn;
}

export interface Api<A> {
  operations: Operations<A>;
  around: (around: Partial<Around<A>>) => Operation<void>;
}

export type Operations<T> = {
  [K in keyof T]: T[K] extends ((...args: infer TArgs) => infer TReturn)
    ? (...args: TArgs) => TReturn
    : T[K] extends Operation<infer TReturn> ? Operation<TReturn>
    : never;
};

export function createApi<A extends {}>(name: string, handler: A): Api<A> {
  let fields = Object.keys(handler) as (keyof A)[];

  let middleware: Around<A> = fields.reduce((sum, field) => {
    return Object.assign(sum, {
      [field]: (args: any, next: any) => next(...args),
    });
  }, {} as Around<A>);

  let context = createContext<Around<A>>(`$api:${name}`, middleware);

  let operations = fields.reduce((api, field) => {
    let handle = handler[field];
    if (typeof handle === "function") {
      return Object.assign(api, {
        [field]: function* (...args: any[]) {
          let around = yield* context.expect();
          let middleware = around[field] as Function;
          return yield* middleware(args, handle);
        },
      });
    } else {
      return Object.assign(api, {
        [field]: {
          *[Symbol.iterator]() {
            let around = yield* context.expect();
            let middleware = around[field] as Function;
            return yield* middleware([], () => handle);
          },
        },
      });
    }
  }, {} as Operations<A>);

  function* around(around: Partial<Around<A>>): Operation<void> {
    let current = yield* context.expect();
    yield* context.set(fields.reduce((sum, field) => {
      let prior = current[field] as Middleware<any[], any>;
      let middleware = around[field] as Middleware<any[], any>;
      return Object.assign(sum, {
        [field]: (args: any, next: any) =>
          middleware(args, (...args) => prior(args, next)),
      });
    }, Object.assign({}, current)));
  }

  return { operations, around };
}

type A = Around<{
  add: (left: number) => Operation<number>;
}>;

type O = Operations<{
  add: (left: number) => Operation<number>;
}>;