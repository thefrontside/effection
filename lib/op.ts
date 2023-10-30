import { type Operation } from "./types.ts";

type Fn<TArgs extends unknown[], TReturn> = (...args: TArgs) => TReturn;

type LiftedFn<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => Operation<TReturn>;

export function op<TArgs extends unknown[], TReturn>(
  fn: Fn<TArgs, TReturn>,
): LiftedFn<TArgs, TReturn> {
  return (...args: TArgs) => {
    let value = fn(...args);
    let next = () => ({ done: true, value } as const);
    return ({
      [Symbol.iterator]: () => ({ next }),
    });
  };
}
