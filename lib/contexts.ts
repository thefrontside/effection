import { createContext } from "./context.ts";
import { Coroutine, Scope } from "./types.ts";

export const Routine = createContext<Coroutine<unknown>>(
  "@effection/coroutine",
);

export const Generation = createContext<number>(
  "@effection/scope.generation",
  0,
);

export const Children = createContext<Set<Scope>>(
  "@effection/scope.children",
);
