import { InstructionQueue, type Instruction } from "../reducer.ts";
import { Err, Ok, type Result } from "../result.ts";
import type { Context, Coroutine, Effect, Operation, Scope } from "../types.ts";
import { api as effection } from "../api.ts";
import type { DurableStream } from "./types.ts";
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
    // Check if it's a plain object (serializable)
    let proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      try {
        // Try JSON roundtrip to verify serializability
        let json = JSON.stringify(value);
        return JSON.parse(json) as Json;
      } catch {
        return createLiveOnlySentinel(value) as unknown as Json;
      }
    }
    // Non-plain objects (Scope, Coroutine, etc.) get sentinel
    return createLiveOnlySentinel(value) as unknown as Json;
  }

  // Functions, symbols, etc.
  return createLiveOnlySentinel(value) as unknown as Json;
}

/**
 * Serialize an Error into a JSON-safe structure.
 */
function serializeError(error: Error): SerializedError {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

/**
 * Deserialize a SerializedError back into an Error instance.
 */
function deserializeError(serialized: SerializedError): Error {
  let error = new Error(serialized.message);
  error.name = serialized.name;
  if (serialized.stack) {
    error.stack = serialized.stack;
  }
  return error;
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
 * The mode (live vs replay) is implicit from the stream cursor:
 *   - cursor < stored events matching current scope → replay
 *   - cursor exhausted → live
 *
 * Phase 2: Also manages scope lifecycle events via Api.Scope middleware.
 * Scope creation, destruction, context set/delete are recorded to the
 * stream and validated during replay.
 */
export class DurableReducer {
  reducing = false;
  readonly queue = new InstructionQueue();

  /**
   * Cursor into the stream's event list. Points to the next event
   * we expect to consume during replay.
   */
  private cursor = 0;

  /**
   * Pre-loaded replay events from the stream, indexed for fast access.
   */
  private replayEvents: ReturnType<DurableStream["read"]>;

  /**
   * Maps live Scope objects to their durable scope IDs.
   */
  private scopeIds = new WeakMap<Scope, string>();

  /**
   * Monotonic counter for generating child scope IDs.
   */
  private scopeOrdinal = 0;

  constructor(public readonly stream: DurableStream) {
    this.replayEvents = stream.read(0);
  }

  /**
   * Generate the next scope ID.
   */
  private nextScopeId(): string {
    return `scope-${++this.scopeOrdinal}`;
  }

  /**
   * Get the durable scope ID for a live Scope object.
   * Throws if the scope was not registered (lifecycle bug).
   */
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

  /**
   * Register a scope with a durable ID.
   */
  private registerScope(scope: Scope, id: string): void {
    this.scopeIds.set(scope, id);
  }

  /**
   * Unregister a scope (after destruction).
   */
  private unregisterScope(scope: Scope): void {
    this.scopeIds.delete(scope);
  }

  /**
   * Install Api.Scope middleware on the given scope to record/replay
   * scope lifecycle events. Must be called on the run scope before
   * any operations execute.
   *
   * The middleware is installed at "max" priority so it wraps around
   * all other scope middleware (including the core implementation).
   */
  installScopeMiddleware(runScope: Scope): void {
    // Register the run scope as "root"
    this.registerScope(runScope, "root");

    // Record or consume scope:created for the root scope
    if (this.isReplaying) {
      let ev = this.peekReplay();
      if (ev && ev.type === "scope:created" && ev.scopeId === "root" && !ev.parentScopeId) {
        this.consumeReplay();
      }
      // If no matching event, that's OK for backwards compatibility
      // with Phase 1 streams that don't have scope events
    } else {
      this.stream.append({
        type: "scope:created",
        scopeId: "root",
      });
    }

    let reducer = this;

    // Install middleware at "max" priority (outermost wrapper)
    runScope.around(api, {
      // Wrap scope creation to record/replay scope:created events
      create(args: [Scope], next: (parent: Scope) => [Scope, () => Operation<void>]) {
        let [parent] = args;
        let parentScopeId = reducer.scopeIds.get(parent);

        // Delegate to the real scope creation
        let [child, destroy] = next(parent);

        if (reducer.isReplaying) {
          // During replay, consume the scope:created event and use its scopeId
          let ev = reducer.peekReplay();
          if (ev && ev.type === "scope:created") {
            // Validate parent relationship
            if (parentScopeId && ev.parentScopeId !== parentScopeId) {
              throw new DivergenceError(
                `scope:created with parent ${ev.parentScopeId}`,
                `scope:created with parent ${parentScopeId}`,
                reducer.cursor,
              );
            }
            reducer.registerScope(child, ev.scopeId);
            reducer.consumeReplay();
          } else {
            // No scope:created in stream — assign a new ID (backwards compat)
            let scopeId = reducer.nextScopeId();
            reducer.registerScope(child, scopeId);
          }
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

      // Wrap scope destruction to record/replay scope:destroyed events
      *destroy(args: [Scope], next: (scope: Scope) => Operation<void>) {
        let [scope] = args;
        let scopeId = reducer.scopeIds.get(scope);

        // Always run real destruction
        let outcome: { ok: true } | { ok: false; error: SerializedError } = { ok: true };
        try {
          yield* next(scope);
        } catch (error) {
          outcome = { ok: false, error: serializeError(error as Error) };
          throw error;
        } finally {
          if (scopeId) {
            if (reducer.isReplaying) {
              // Consume the scope:destroyed event
              let ev = reducer.peekReplay();
              if (ev && ev.type === "scope:destroyed" && ev.scopeId === scopeId) {
                reducer.consumeReplay();
              }
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

      // Wrap context set to record scope:set events
      set(args: [Scope, Context<unknown>, unknown], next: (scope: Scope, context: Context<unknown>, value: unknown) => unknown) {
        let [scope, context, value] = args;
        let result = next(scope, context, value);

        let scopeId = reducer.scopeIds.get(scope);
        if (scopeId) {
          let serializedValue = toJson(value);
          if (reducer.isReplaying) {
            let ev = reducer.peekReplay();
            if (ev && ev.type === "scope:set" && ev.scopeId === scopeId && ev.contextName === context.name) {
              reducer.consumeReplay();
            }
          } else {
            // Only record user-facing context sets, not infrastructure
            // (Priority, Children, DelimiterContext, ErrorContext, TaskGroupContext, ReducerContext are infra)
            if (!isInfrastructureContext(context.name)) {
              reducer.stream.append({
                type: "scope:set",
                scopeId,
                contextName: context.name,
                value: serializedValue,
              });
            }
          }
        }

        return result;
      },

      // Wrap context delete to record scope:delete events
      delete(args: [Scope, Context<unknown>], next: (scope: Scope, context: Context<unknown>) => boolean) {
        let [scope, context] = args;
        let result = next(scope, context);

        let scopeId = reducer.scopeIds.get(scope);
        if (scopeId) {
          if (reducer.isReplaying) {
            let ev = reducer.peekReplay();
            if (ev && ev.type === "scope:delete" && ev.scopeId === scopeId && ev.contextName === context.name) {
              reducer.consumeReplay();
            }
          } else {
            if (!isInfrastructureContext(context.name)) {
              reducer.stream.append({
                type: "scope:delete",
                scopeId,
                contextName: context.name,
              });
            }
          }
        }

        return result;
      },
    }, { at: "max" });
  }

  /**
   * Check if the replay cursor is pointing at a root scope:destroyed event.
   * Used by run() to consume root lifecycle events during replay.
   */
  isReplayingRoot(): boolean {
    if (!this.isReplaying) return false;
    let ev = this.peekReplay();
    return !!(ev && ev.type === "scope:destroyed" && ev.scopeId === "root");
  }

  /**
   * Consume the root scope:destroyed event during replay.
   */
  consumeRootDestroyed(): void {
    if (this.isReplaying) {
      let ev = this.peekReplay();
      if (ev && ev.type === "scope:destroyed" && ev.scopeId === "root") {
        this.consumeReplay();
      }
    }
  }

  /**
   * Record a workflow:return event. Called from the run() wrapper
   * just before the workflow scope is destroyed.
   */
  recordWorkflowReturn(scope: Scope, value: unknown): void {
    let scopeId = this.getScopeId(scope);
    if (this.isReplaying) {
      let ev = this.peekReplay();
      if (ev && ev.type === "workflow:return" && ev.scopeId === scopeId) {
        this.consumeReplay();
      }
    } else {
      this.stream.append({
        type: "workflow:return",
        scopeId,
        value: toJson(value),
      });
    }
  }

  /**
   * Peek at the next replay event without advancing the cursor.
   * Returns undefined if replay is exhausted.
   */
  private peekReplay() {
    if (this.cursor < this.replayEvents.length) {
      return this.replayEvents[this.cursor].event;
    }
    return undefined;
  }

  /**
   * Advance the cursor past the current replay event.
   */
  private consumeReplay() {
    this.cursor++;
  }

  /**
   * Check if we're in replay mode (have unconsumed stored events).
   */
  private get isReplaying(): boolean {
    return this.cursor < this.replayEvents.length;
  }

  /**
   * Skip over non-effect events in the replay stream (scope events, etc.)
   * that were not consumed by the scope middleware.
   * These are informational and don't correspond to generator yields.
   */
  private skipNonEffectEvents(): void {
    while (this.isReplaying) {
      let ev = this.peekReplay();
      if (!ev || ev.type === "effect:yielded") break;
      this.consumeReplay();
    }
  }

  /**
   * The reduce method — drop-in replacement for Reducer.reduce.
   *
   * This is an arrow function property to match Effection's Reducer
   * which also declares `reduce` as an arrow function (important for
   * `this` binding when passed around).
   */
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
          routine.next(Err(error as Error));
        }
        item = queue.dequeue();
      }
    } finally {
      this.reducing = false;
    }
  };

  /**
   * Check if an effect description belongs to Effection's internal
   * infrastructure (task setup, scope management, etc.).
   *
   * These effects are always executed live — they create non-serializable
   * values (Coroutine, Scope) that are needed for the runtime to function.
   * During replay, matching infrastructure events in the stream are skipped.
   */
  private isInfrastructureEffect(description: string): boolean {
    return (
      description === "useCoroutine()" ||
      description.startsWith("do <") ||
      description === "useScope()" ||
      description === "trap return"
    );
  }

  /**
   * Skip infrastructure effect events (yielded + resolution pair) in the
   * replay stream. These correspond to effects that are always re-executed
   * live and don't need replay.
   */
  private skipInfrastructureEvents(): void {
    while (this.isReplaying) {
      let ev = this.peekReplay();
      if (!ev) break;

      // Skip non-effect events (scope events, workflow events)
      if (ev.type !== "effect:yielded") {
        this.consumeReplay();
        continue;
      }

      // If it's an infrastructure effect, skip it and its resolution
      if (this.isInfrastructureEffect(ev.description)) {
        let infraId = ev.effectId;
        this.consumeReplay(); // skip yielded

        // Also skip the corresponding resolution
        let resolution = this.peekReplay();
        if (
          resolution &&
          (resolution.type === "effect:resolved" || resolution.type === "effect:errored") &&
          resolution.effectId === infraId
        ) {
          this.consumeReplay();
        }
        continue;
      }

      // Found a non-infrastructure effect:yielded — stop skipping
      break;
    }
  }

  /**
   * Handle a yielded effect — either replay from stream or execute live.
   */
  private handleEffect(effect: Effect<unknown>, routine: Coroutine): void {
    let description = effect.description ?? "unknown";
    let effectId = nextEffectId();

    // Resolve the scope ID for this coroutine's scope
    let scopeId = this.scopeIds.get(routine.scope) ?? "unknown";

    // Infrastructure effects always execute live — skip matching events
    // in the replay stream and fall through to the live path.
    if (this.isInfrastructureEffect(description)) {
      // Skip any infrastructure events at current cursor position
      this.skipInfrastructureEvents();
      // Fall through to live execution (don't record — these are
      // recreated on each run)
      routine.data.exit = effect.enter(routine.next, routine);
      return;
    }

    // Skip infrastructure events in the replay stream to find the
    // next user-facing effect event
    this.skipInfrastructureEvents();

    // Check if we can replay this effect
    let replayEvent = this.peekReplay();

    if (replayEvent && replayEvent.type === "effect:yielded") {
      // Divergence detection: the description must match
      if (replayEvent.description !== description) {
        throw new DivergenceError(
          replayEvent.description,
          description,
          this.cursor,
        );
      }

      // Consume the effect:yielded event
      effectId = replayEvent.effectId;
      this.consumeReplay();

      // Now look for the corresponding resolution event
      let resolutionEvent = this.peekReplay();

      if (resolutionEvent && resolutionEvent.type === "effect:resolved" && resolutionEvent.effectId === effectId) {
        // Replay: feed stored result without calling enter()
        this.consumeReplay();
        let result: Result<unknown> = Ok(resolutionEvent.value);
        routine.data.exit = (resolve) => resolve(Ok());
        routine.next(result);
        return;
      }

      if (resolutionEvent && resolutionEvent.type === "effect:errored" && resolutionEvent.effectId === effectId) {
        // Replay: feed stored error without calling enter()
        this.consumeReplay();
        let error = deserializeError(resolutionEvent.error);
        let result: Result<unknown> = Err(error);
        routine.data.exit = (resolve) => resolve(Ok());
        routine.next(result);
        return;
      }

      // Resolution event missing or doesn't match — fall through to live
      // (This handles the case where the stream was truncated mid-effect)
    }

    // Live path: record and execute
    this.stream.append({
      type: "effect:yielded",
      scopeId,
      effectId,
      description,
    });

    // Wrap routine.next to intercept the resolution
    let originalNext = routine.next.bind(routine);
    let stream = this.stream;

    let wrappedNext = (result: Result<unknown>) => {
      // Record the resolution
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

      // Restore original next and forward
      routine.next = originalNext;
      originalNext(result);
    };

    // Temporarily replace routine.next with our wrapper
    routine.next = wrappedNext;

    // Execute the effect live
    routine.data.exit = effect.enter(routine.next, routine);
  }
}

/**
 * Check if a context name belongs to Effection's internal infrastructure.
 * These are not recorded as scope:set/scope:delete events.
 */
function isInfrastructureContext(name: string): boolean {
  return (
    name === "@effection/scope.generation" || // Priority
    name === "@effection/scope.children" ||   // Children
    name === "@effection/coroutine" ||        // Routine
    name === "@effection/reducer" ||          // ReducerContext
    name === "@effection/delimiter" ||        // DelimiterContext
    name === "@effection/boundary" ||         // ErrorContext
    name === "@effection/task-group" ||       // TaskGroupContext
    name === "each" ||                        // EachStack
    name.startsWith("api::")                  // Api contexts (api::Scope, api::Main, etc.)
  );
}
