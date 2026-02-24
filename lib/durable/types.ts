// ── JSON-safe types ────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
}

// ── Durable Event types ────────────────────────────────────────────
//
// These describe what gets written to the Durable Stream.
// Each event is a discriminated union member keyed on `type`.

export type DurableEvent =
  | EffectYielded
  | EffectResolved
  | EffectErrored
  | ScopeCreated
  | ScopeDestroyed
  | ScopeSet
  | ScopeDelete
  | WorkflowReturn;

export interface EffectYielded {
  type: "effect:yielded";
  scopeId: string;
  effectId: string;
  description: string;
}

export interface EffectResolved {
  type: "effect:resolved";
  effectId: string;
  value: Json;
}

export interface EffectErrored {
  type: "effect:errored";
  effectId: string;
  error: SerializedError;
}

export interface ScopeCreated {
  type: "scope:created";
  scopeId: string;
  parentScopeId?: string;
}

export interface ScopeDestroyed {
  type: "scope:destroyed";
  scopeId: string;
  result: { ok: true } | { ok: false; error: SerializedError };
}

export interface ScopeSet {
  type: "scope:set";
  scopeId: string;
  contextName: string;
  value: Json;
}

export interface ScopeDelete {
  type: "scope:delete";
  scopeId: string;
  contextName: string;
}

export interface WorkflowReturn {
  type: "workflow:return";
  scopeId: string;
  value: Json;
}

// ── Durable Stream interface ───────────────────────────────────────
//
// Minimal interface matching the Durable Streams protocol concepts:
// append-only, offset-based, readable.

export interface StreamEntry {
  offset: number;
  event: DurableEvent;
}

export interface DurableStream {
  /** Append an event to the stream. Returns the assigned offset. */
  append(event: DurableEvent): number;

  /** Read all entries from `fromOffset` (inclusive) to current tail. */
  read(fromOffset?: number): StreamEntry[];

  /** Get the current number of entries in the stream. */
  length: number;

  /** Whether the stream has been closed (workflow complete/halted). */
  closed: boolean;

  /** Close the stream, signaling EOF. */
  close(): void;
}

// ── Divergence Error ───────────────────────────────────────────────
//
// Thrown when a replay detects that the current execution has diverged
// from the recorded stream (e.g., different effect yielded at a given
// position).

export class DivergenceError extends Error {
  override name = "DivergenceError";

  constructor(
    public expected: string,
    public actual: string,
    public offset: number,
  ) {
    super(
      `Divergence at offset ${offset}: expected effect "${expected}" but got "${actual}"`,
    );
  }
}

// ── Serialization sentinel ─────────────────────────────────────────
//
// Non-JSON-serializable values (Scope, Coroutine, Iterable, etc.) are
// stored as this sentinel in the stream. During replay, encountering
// a __liveOnly sentinel means the value cannot be reconstructed from
// the stream alone.

export interface LiveOnlySentinel {
  __liveOnly: true;
  __type: string;
  __toString: string;
}

export function isLiveOnly(value: Json): value is Json & LiveOnlySentinel {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).__liveOnly === true
  );
}

export function createLiveOnlySentinel(value: unknown): LiveOnlySentinel {
  return {
    __liveOnly: true,
    __type: typeof value === "object" && value !== null
      ? value.constructor?.name ?? "Object"
      : typeof value,
    __toString: String(value),
  };
}
