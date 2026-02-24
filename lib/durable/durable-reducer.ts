import { InstructionQueue, type Instruction } from "../reducer.ts";
import { Err, Ok, type Result } from "../result.ts";
import type { Coroutine, Effect } from "../types.ts";
import type { DurableStream } from "./types.ts";
import {
  type Json,
  type SerializedError,
  DivergenceError,
  createLiveOnlySentinel,
} from "./types.ts";

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
function toJson(value: unknown): Json {
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

  constructor(public readonly stream: DurableStream) {
    this.replayEvents = stream.read(0);
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
   * Skip over non-effect events in the replay stream (scope events, etc.).
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
      scopeId: "root", // TODO: proper scope IDs in Phase 2
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
