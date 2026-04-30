import { createContext } from "./context.ts";
import type { Coroutine, Scope } from "./types.ts";

export const Routine = createContext<Coroutine<unknown>>(
  "@effection/coroutine",
);

export const Priority = createContext<number>(
  "@effection/scope.generation",
  0,
);

export const Children = createContext<Set<Scope>>(
  "@effection/scope.children",
);

/**
 * `true` once any shutdown — natural (encapsulate winding down children)
 * or forced (a routine.return has been issued by Delimiter.exit) — has
 * begun on this scope. Once set, Delimiter.exit refuses to issue another
 * return; the in-flight shutdown will observe the final outcome through
 * the delimiter's `outcome` field when its iterator reaches its finally.
 *
 * @internal
 */
export const Draining = createContext<boolean>(
  "@effection/scope.draining",
  false,
);
