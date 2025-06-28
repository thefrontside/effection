import { createContext } from "./context.ts";
import { Just, type Maybe } from "./maybe.ts";
import { Err, type Result } from "./result.ts";

export interface Boundary<T> {
  outcome: Maybe<Result<T>>;
  runLevel: 0;
}

export const BoundaryContext = createContext<Boundary<unknown>>(
  "@effection/trap",
  {
    outcome: Just(Err(new Error("unbounded context"))),
    runLevel: 0,
  },
);
