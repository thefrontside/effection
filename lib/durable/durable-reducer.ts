import { InstructionQueue, type Instruction } from "../reducer.ts";
import { Err, Ok, type Result } from "../result.ts";
import type { Context, Coroutine, Effect, Operation, Scope } from "../types.ts";
import { api as effection } from "../api.ts";
import { DelimiterContext } from "../delimiter.ts";
import type { DurableStream } from "./types.ts";
import type { DurableEvent } from "./types.ts";
import {
  type Json,
  type SerializedError,
  DivergenceError,
  createLiveOnlySentinel,
} from "./types.ts";

const api = effection.Scope;

/**
 * A unique effect ID counter, scoped to a single DurableReducer instance.
 */
let globalEffectCounter = 0;

function nextEffectId(): string {
  return `effect-${++globalEffectCounter}`;
}

/**
 * Serialize a value to Json, replacing non-serializable values with
 * a __liveOnly sentinel.
 */
export function toJson(value: unknown): Json {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    return value.map(toJson);
  }

  if (typeof value === "object") {
    let proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      try {
        let json = JSON.stringify(value);
        return JSON.parse(json) as Json;
      } catch {
        return createLiveOnlySentinel(value) as unknown as Json;
      }
    }
    return createLiveOnlySentinel(value) as unknown as Json;
  }

  return createLiveOnlySentinel(value) as unknown as Json;
}

function serializeError(error: Error): SerializedError {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

function deserializeError(serialized: SerializedError): Error {
  let error = new Error(serialized.message);
  error.name = serialized.name;
  if (serialized.stack) {
    error.stack = serialized.stack;
  }
  return error;
}

/**
 * Indexes replay events for per-scope access.
 *
 * During concurrent execution, effects from different scopes interleave
 * non-deterministically. Both effect events and lifecycle events can
 * appear in different orders during replay. This index provides:
 *
 * 1. Per-scope effect cursors (effect:yielded + resolutions)
 * 2. Per-scope lifecycle event lookup (scope:created, scope:destroyed,
 *    workflow:return indexed by scopeId)
 * 3. Ordered scope creation list (for assigning scope IDs during replay)
 */
class ReplayIndex {
  /**
   * Per-scope list of user-facing effect events.
   */
  private scopeEffects = new Map<string, Array<{ offset: number; event: DurableEvent }>>();

  /**
   * Per-scope cursor into the scopeEffects arrays.
   */
  private scopeCursors = new Map<string, number>();

  /**
   * Map from effectId to its resolution event.
   */
  private resolutions = new Map<string, DurableEvent>();

  /**
   * scope:created events indexed by scopeId for direct lookup.
   */
  private scopeCreatedEvents = new Map<string, DurableEvent & { type: "scope:created" }>();

  /**
   * scope:destroyed events indexed by scopeId.
   */
  private scopeDestroyedEvents = new Map<string, DurableEvent & { type: "scope:destroyed" }>();

  /**
   * workflow:return events indexed by scopeId.
   */
  private workflowReturnEvents = new Map<string, DurableEvent & { type: "workflow:return" }>();

  /**
   * Ordered list of scope:created events for sequential consumption
   * during replay (scopes are created deterministically in tree order).
   */
  private scopeCreationOrder: Array<DurableEvent & { type: "scope:created" }> = [];
  private scopeCreationCursor = 0;

  /**
   * Set of consumed scope IDs (for lifecycle events).
   */
  private consumedCreations = new Set<string>();
  private consumedDestructions = new Set<string>();
  private consumedReturns = new Set<string>();

  /**
   * Whether there are any replay events at all.
   */
  readonly hasEvents: boolean;

  constructor(
    entries: ReturnType<DurableStream["read"]>,
    isInfrastructure: (description: string) => boolean,
  ) {
    this.hasEvents = entries.length > 0;

    let infraEffectIds = new Set<string>();

    for (let i = 0; i < entries.length; i++) {
      let { event } = entries[i];

      if (event.type === "scope:created") {
        this.scopeCreatedEvents.set(event.scopeId, event);
        this.scopeCreationOrder.push(event);
        continue;
      }

      if (event.type === "scope:destroyed") {
        this.scopeDestroyedEvents.set(event.scopeId, event);
        continue;
      }

      if (event.type === "workflow:return") {
        this.workflowReturnEvents.set(event.scopeId, event);
        continue;
      }

      if (event.type === "scope:set" || event.type === "scope:delete") {
        // These are informational; not currently replayed with ordering
        continue;
      }

      if (event.type === "effect:yielded") {
        if (isInfrastructure(event.description)) {
          infraEffectIds.add(event.effectId);
          continue;
        }

        let scopeId = event.scopeId;
        if (!this.scopeEffects.has(scopeId)) {
          this.scopeEffects.set(scopeId, []);
        }
        this.scopeEffects.get(scopeId)!.push({ offset: i, event });
        continue;
      }

      if (event.type === "effect:resolved" || event.type === "effect:errored") {
        if (infraEffectIds.has(event.effectId)) {
          continue;
        }
        this.resolutions.set(event.effectId, event);
        continue;
      }
    }
  }

  // ── Scope creation (deterministic tree order) ────────────────────

  /**
   * Peek at the next scope:created event in creation order.
   */
  peekScopeCreation(): (DurableEvent & { type: "scope:created" }) | undefined {
    if (this.scopeCreationCursor < this.scopeCreationOrder.length) {
      let ev = this.scopeCreationOrder[this.scopeCreationCursor];
      if (this.consumedCreations.has(ev.scopeId)) {
        // Already consumed (e.g., root was consumed directly)
        this.scopeCreationCursor++;
        return this.peekScopeCreation();
      }
      return ev;
    }
    return undefined;
  }

  /**
   * Consume the current scope:created event.
   */
  consumeScopeCreation(scopeId: string): void {
    this.consumedCreations.add(scopeId);
    // Advance cursor past consumed events
    while (
      this.scopeCreationCursor < this.scopeCreationOrder.length &&
      this.consumedCreations.has(this.scopeCreationOrder[this.scopeCreationCursor].scopeId)
    ) {
      this.scopeCreationCursor++;
    }
  }

  /**
   * Check if a specific scope has a recorded creation event.
   */
  hasScopeCreation(scopeId: string): boolean {
    return this.scopeCreatedEvents.has(scopeId) && !this.consumedCreations.has(scopeId);
  }

  /**
   * Get the scope:created event for a specific scopeId.
   */
  getScopeCreation(scopeId: string): (DurableEvent & { type: "scope:created" }) | undefined {
    if (this.consumedCreations.has(scopeId)) return undefined;
    return this.scopeCreatedEvents.get(scopeId);
  }

  /**
   * Check if there are more scope creation events to replay.
   */
  get hasMoreCreations(): boolean {
    return this.peekScopeCreation() !== undefined;
  }

  // ── Scope destruction (per-scope lookup) ─────────────────────────

  /**
   * Check if a scope has a recorded destruction event.
   */
  hasScopeDestruction(scopeId: string): boolean {
    return this.scopeDestroyedEvents.has(scopeId) && !this.consumedDestructions.has(scopeId);
  }

  /**
   * Consume the scope:destroyed event for a specific scope.
   */
  consumeScopeDestruction(scopeId: string): void {
    this.consumedDestructions.add(scopeId);
  }

  // ── Workflow return (per-scope lookup) ────────────────────────────

  /**
   * Check if a scope has a recorded workflow:return event.
   */
  hasWorkflowReturn(scopeId: string): boolean {
    return this.workflowReturnEvents.has(scopeId) && !this.consumedReturns.has(scopeId);
  }

  /**
   * Consume the workflow:return event for a specific scope.
   */
  consumeWorkflowReturn(scopeId: string): void {
    this.consumedReturns.add(scopeId);
  }

  // ── Per-scope effect cursors ─────────────────────────────────────

  peekScopeEffect(scopeId: string): DurableEvent | undefined {
    let effects = this.scopeEffects.get(scopeId);
    if (!effects) return undefined;
    let cursor = this.scopeCursors.get(scopeId) ?? 0;
    if (cursor < effects.length) {
      return effects[cursor].event;
    }
    return undefined;
  }

  consumeScopeEffect(scopeId: string): void {
    let cursor = this.scopeCursors.get(scopeId) ?? 0;
    this.scopeCursors.set(scopeId, cursor + 1);
  }

  getScopeEffectOffset(scopeId: string): number {
    let effects = this.scopeEffects.get(scopeId);
    if (!effects) return -1;
    let cursor = this.scopeCursors.get(scopeId) ?? 0;
    if (cursor < effects.length) {
      return effects[cursor].offset;
    }
    return -1;
  }

  hasScopeEffects(scopeId: string): boolean {
    let effects = this.scopeEffects.get(scopeId);
    if (!effects) return false;
    let cursor = this.scopeCursors.get(scopeId) ?? 0;
    return cursor < effects.length;
  }

  getResolution(effectId: string): DurableEvent | undefined {
    return this.resolutions.get(effectId);
  }
}

/**
 * DurableReducer replaces Effection's built-in Reducer.
 *
 * It is duck-typed to match the Reducer interface:
 *   - `reducing: boolean`
 *   - `reduce(instruction: Instruction): void`
 *
 * On the live path, it delegates to effect.enter() and records
 * resolutions to the DurableStream. On the replay path, it reads
 * stored results and feeds them back without calling enter().
 *
 * Phase 5: Uses per-scope cursors and per-scope lifecycle lookups
 * for replay to handle concurrent interleaving correctly.
 */
export class DurableReducer {
  reducing = false;
  readonly queue = new InstructionQueue();

  private replayIndex: ReplayIndex;
  private scopeIds = new WeakMap<Scope, string>();
  private scopeOrdinal = 0;

  constructor(public readonly stream: DurableStream) {
    this.replayIndex = new ReplayIndex(
      stream.read(0),
      (desc) => this.isInfrastructureEffect(desc),
    );
  }

  private nextScopeId(): string {
    return `scope-${++this.scopeOrdinal}`;
  }

  getScopeId(scope: Scope): string {
    let id = this.scopeIds.get(scope);
    if (!id) {
      throw new Error(
        "DurableReducer: scope not registered. This indicates a lifecycle bug — " +
        "the scope was not created through the durable middleware.",
      );
    }
    return id;
  }

  private registerScope(scope: Scope, id: string): void {
    this.scopeIds.set(scope, id);
  }

  private unregisterScope(scope: Scope): void {
    this.scopeIds.delete(scope);
  }

  installScopeMiddleware(runScope: Scope): void {
    this.registerScope(runScope, "root");

    // Record or consume scope:created for the root scope
    if (this.replayIndex.hasScopeCreation("root")) {
      this.replayIndex.consumeScopeCreation("root");
    } else {
      this.stream.append({
        type: "scope:created",
        scopeId: "root",
      });
    }

    let reducer = this;

    runScope.around(api, {
      create(args: [Scope], next: (parent: Scope) => [Scope, () => Operation<void>]) {
        let [parent] = args;
        let parentScopeId = reducer.scopeIds.get(parent);

        let [child, destroy] = next(parent);

        // Check if the next scope creation in the replay matches
        let ev = reducer.replayIndex.peekScopeCreation();
        if (ev) {
          // Validate parent relationship
          if (parentScopeId && ev.parentScopeId !== parentScopeId) {
            throw new DivergenceError(
              `scope:created with parent ${ev.parentScopeId}`,
              `scope:created with parent ${parentScopeId}`,
              -1,
            );
          }
          reducer.registerScope(child, ev.scopeId);
          reducer.replayIndex.consumeScopeCreation(ev.scopeId);
        } else {
          // Live path: assign ID and record
          let scopeId = reducer.nextScopeId();
          reducer.registerScope(child, scopeId);
          reducer.stream.append({
            type: "scope:created",
            scopeId,
            parentScopeId,
          });
        }

        return [child, destroy];
      },

      *destroy(args: [Scope], next: (scope: Scope) => Operation<void>) {
        let [scope] = args;
        let scopeId = reducer.scopeIds.get(scope);

        let outcome: { ok: true } | { ok: false; error: SerializedError } = { ok: true };
        try {
          yield* next(scope);
        } catch (error) {
          outcome = { ok: false, error: serializeError(error as Error) };
          throw error;
        } finally {
          if (scopeId) {
            // Emit workflow:return before scope:destroyed
            reducer.emitWorkflowReturn(scope, scopeId);

            if (reducer.replayIndex.hasScopeDestruction(scopeId)) {
              reducer.replayIndex.consumeScopeDestruction(scopeId);
            } else {
              reducer.stream.append({
                type: "scope:destroyed",
                scopeId,
                result: outcome,
              });
            }
            reducer.unregisterScope(scope);
          }
        }
      },

      set(args: [Scope, Context<unknown>, unknown], next: (scope: Scope, context: Context<unknown>, value: unknown) => unknown) {
        let [scope, context, value] = args;
        let result = next(scope, context, value);

        let scopeId = reducer.scopeIds.get(scope);
        if (scopeId && !isInfrastructureContext(context.name)) {
          // Only record in live mode (not during replay of this scope)
          if (!reducer.replayIndex.hasScopeEffects(scopeId) && !reducer.replayIndex.hasScopeDestruction(scopeId)) {
            reducer.stream.append({
              type: "scope:set",
              scopeId,
              contextName: context.name,
              value: toJson(value),
            });
          }
        }

        return result;
      },

      delete(args: [Scope, Context<unknown>], next: (scope: Scope, context: Context<unknown>) => boolean) {
        let [scope, context] = args;
        let result = next(scope, context);

        let scopeId = reducer.scopeIds.get(scope);
        if (scopeId && !isInfrastructureContext(context.name)) {
          if (!reducer.replayIndex.hasScopeEffects(scopeId) && !reducer.replayIndex.hasScopeDestruction(scopeId)) {
            reducer.stream.append({
              type: "scope:delete",
              scopeId,
              contextName: context.name,
            });
          }
        }

        return result;
      },
    }, { at: "max" });
  }

  isReplayingRoot(): boolean {
    return this.replayIndex.hasScopeDestruction("root");
  }

  consumeRootDestroyed(): void {
    this.replayIndex.consumeScopeDestruction("root");
  }

  emitWorkflowReturn(scope: Scope, scopeId: string, value?: unknown): void {
    let returnValue: unknown = value;
    let hasValue = arguments.length > 2;

    if (!hasValue) {
      let delimiter = scope.get(DelimiterContext);
      if (delimiter && delimiter.computed && delimiter.outcome?.exists && delimiter.outcome.value.ok) {
        returnValue = delimiter.outcome.value.value;
        hasValue = true;
      }
    }

    if (!hasValue) return;

    if (this.replayIndex.hasWorkflowReturn(scopeId)) {
      this.replayIndex.consumeWorkflowReturn(scopeId);
    } else {
      this.stream.append({
        type: "workflow:return",
        scopeId,
        value: toJson(returnValue),
      });
    }
  }

  reduce = (instruction: Instruction) => {
    let { queue } = this;

    queue.enqueue(instruction);

    if (this.reducing) return;

    try {
      this.reducing = true;

      let item = queue.dequeue();
      while (item) {
        let [, routine, result, , method = "next" as const] = item;
        try {
          let iterator = routine.data.iterator;

          if (result.ok) {
            if (method === "next") {
              let next = iterator.next(result.value);
              if (!next.done) {
                let effect = next.value;
                this.handleEffect(effect, routine);
              }
            } else if (iterator.return) {
              let next = iterator.return(result.value);
              if (!next.done) {
                let effect = next.value;
                this.handleEffect(effect, routine);
              }
            }
          } else if (iterator.throw) {
            let next = iterator.throw(result.error);
            if (!next.done) {
              let effect = next.value;
              this.handleEffect(effect, routine);
            }
          } else {
            throw result.error;
          }
        } catch (error) {
          if (error instanceof DivergenceError) {
            // DivergenceError is a fatal infrastructure error that must
            // propagate immediately. It cannot go through the normal
            // instruction queue because the Delimiter validator may
            // drop it during replay (the scope finalizes synchronously
            // before the error instruction is dequeued).
            throw error;
          }
          routine.next(Err(error as Error));
        }
        item = queue.dequeue();
      }
    } finally {
      this.reducing = false;
    }
  };

  private isInfrastructureEffect(description: string): boolean {
    return (
      description === "useCoroutine()" ||
      description.startsWith("do <") ||
      description === "useScope()" ||
      description === "trap return" ||
      description === "await resource" ||
      description === "await winner" ||
      description === "await delimiter" ||
      description === "await future" ||
      description === "await destruction" ||
      description === "await callcc" ||
      description === "await each done" ||
      description === "await each context"
    );
  }

  private handleEffect(effect: Effect<unknown>, routine: Coroutine): void {
    let description = effect.description ?? "unknown";
    let effectId = nextEffectId();
    let shouldRecordYielded = true;

    let scopeId = this.scopeIds.get(routine.scope) ?? "unknown";

    // Infrastructure effects always execute live
    if (this.isInfrastructureEffect(description)) {
      routine.data.exit = effect.enter(routine.next, routine);
      return;
    }

    // Check if we can replay this effect (per-scope cursor)
    let replayEvent = this.replayIndex.peekScopeEffect(scopeId);

    if (replayEvent && replayEvent.type === "effect:yielded") {
      // Divergence detection
      if (replayEvent.description !== description) {
        throw new DivergenceError(
          replayEvent.description,
          description,
          this.replayIndex.getScopeEffectOffset(scopeId),
        );
      }

      effectId = replayEvent.effectId;
      this.replayIndex.consumeScopeEffect(scopeId);

      let resolutionEvent = this.replayIndex.getResolution(effectId);

      if (resolutionEvent && resolutionEvent.type === "effect:resolved") {
        let result: Result<unknown> = Ok(resolutionEvent.value);
        routine.data.exit = (resolve) => resolve(Ok());
        routine.next(result);
        return;
      }

      if (resolutionEvent && resolutionEvent.type === "effect:errored") {
        let error = deserializeError(resolutionEvent.error);
        let result: Result<unknown> = Err(error);
        routine.data.exit = (resolve) => resolve(Ok());
        routine.next(result);
        return;
      }

      // Resolution missing — run live and record only the missing
      // resolution for the existing effectId (do not re-record yielded).
      shouldRecordYielded = false;
    }

    // Live path: record and execute
    if (shouldRecordYielded) {
      this.stream.append({
        type: "effect:yielded",
        scopeId,
        effectId,
        description,
      });
    }

    let originalNext = routine.next.bind(routine);
    let stream = this.stream;

    let wrappedNext = (result: Result<unknown>) => {
      if (result.ok) {
        stream.append({
          type: "effect:resolved",
          effectId,
          value: toJson(result.value),
        });
      } else {
        stream.append({
          type: "effect:errored",
          effectId,
          error: serializeError(result.error),
        });
      }

      routine.next = originalNext;
      originalNext(result);
    };

    routine.next = wrappedNext;
    routine.data.exit = effect.enter(routine.next, routine);
  }
}

function isInfrastructureContext(name: string): boolean {
  return (
    name === "@effection/scope.generation" ||
    name === "@effection/scope.children" ||
    name === "@effection/coroutine" ||
    name === "@effection/reducer" ||
    name === "@effection/delimiter" ||
    name === "@effection/boundary" ||
    name === "@effection/task-group" ||
    name === "each" ||
    name.startsWith("api::")
  );
}
