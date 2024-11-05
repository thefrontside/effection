import { Ok } from "./result.ts";
import { Effect, Operation, Scope } from "./types.ts";

export function* useScope(): Operation<Scope> {
  return (yield {
    description: `useScope()`,
    enter(resolve, { scope }) {
      resolve(Ok(scope));
      return (resolve) => resolve(Ok());
    },
  } as Effect<Scope>) as Scope;
}
