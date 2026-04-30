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

/**
 * `true` once a forced unwind has been requested for this scope —
 * either via task.halt() (interrupt) or via an error propagating up
 * the delimiter chain (raise). Distinct from `Draining`: natural
 * completion of an operation marks the scope as draining (so a
 * concurrent halt does not re-fire return), but does not mark it as
 * cancelled.
 *
 * In v4.x, `Cancelled` is read by tooling that wants to know whether
 * the work currently running is cleanup-after-halt vs. normal flow.
 * In v5, yields outside `critical()` will short-circuit when their
 * scope is `Cancelled`.
 *
 * @since 4.1
 */
export const Cancelled = createContext<boolean>(
  "@effection/scope.cancelled",
  false,
);

/**
 * `true` inside `critical()`. Marks a region of code that should
 * complete even when its surrounding scope is `Cancelled`. In v4.x
 * this is a marker only; in v5 it suppresses the sticky-return
 * behaviour that otherwise short-circuits yields in cancelled scopes.
 *
 * @since 4.1
 */
export const Shielded = createContext<boolean>(
  "@effection/scope.shielded",
  false,
);
