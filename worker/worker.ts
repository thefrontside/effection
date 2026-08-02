import {
  Err,
  Ok,
  type Operation,
  type Result,
  createChannel,
  ensure,
  on,
  once,
  resource,
  spawn,
  withResolvers,
} from "effection";
import Worker from "web-worker";

import { useChannelRequest, useChannelResponse } from "./channel.ts";
import {
  type ForEachContext,
  type SerializedError,
  errorFromSerialized,
} from "./types.ts";
// Note: Ok/Err still used for outcome handling; serializeError no longer needed here

/**
 * Resource returned by useWorker, providing APIs for worker communication.
 *
 * @template TSend - value main thread will send to the worker
 * @template TRecv - value main thread will receive from the worker
 * @template TReturn - worker operation return value
 */
export interface WorkerResource<TSend, TRecv, TReturn>
  extends Operation<TReturn> {
  /**
   * Send a message to the worker and wait for a response.
   */
  send(data: TSend): Operation<TRecv>;
  /**
   * Handle requests initiated by the worker.
   * Only one forEach can be active at a time.
   *
   * The handler receives a context object with a `progress` method for
   * sending progress updates back to the worker.
   *
   * @template WRequest - value worker sends to host
   * @template WResponse - value host sends back to worker
   * @template WProgress - progress type sent back to worker (optional)
   *
   * @example Basic usage (no progress)
   * ```ts
   * yield* worker.forEach(function* (request) {
   *   return computeResponse(request);
   * });
   * ```
   *
   * @example With progress streaming
   * ```ts
   * yield* worker.forEach(function* (request, ctx) {
   *   yield* ctx.progress({ step: 1, message: "Starting..." });
   *   yield* ctx.progress({ step: 2, message: "Processing..." });
   *   return { result: "done" };
   * });
   * ```
   */
  forEach<WRequest, WResponse, WProgress = never>(
    fn: (
      request: WRequest,
      ctx: ForEachContext<WProgress>,
    ) => Operation<WResponse>,
  ): Operation<TReturn>;
}

/**
 * Use on the main thread to create and exeecute a well behaved web worker.
 *
 * @example Compute a single value
 * ```ts
 * import { run } from "effection";
 * import { useWorker } from "@effectionx/worker"
 *
 * await run(function*() {
 *    const worker = yield* useWorker("script.ts", { type: "module" });
 *
 *    try {
 *      const result = yield* worker;
 *    } catch (e) {
 *      console.error(e);
 *    }
 * });
 * ```
 *
 * @example Compute multipe values
 * ```ts
 * import { run } from "effection";
 * import { useWorker } from "@effectionx/worker"
 *
 * await run(function*() {
 *    const worker = yield* useWorker("script.ts", { type: "module" });
 *
 *    try {
 *      const result1 = yield* worker.send("Tom");
 *      const result2 = yield* worker.send("Dick");
 *      const result2 = yield* worker.send("Harry");
 *
 *      // get the last result
 *      const finalResult = yield* worker;
 *    } catch (e) {
 *      console.error(e);
 *    }
 * });
 * ```
 *
 * @param url URL or string of script
 * @param options WorkerOptions
 * @template TSend - value main thread will send to the worker
 * @template TRecv - value main thread will receive from the worker
 * @template TReturn - worker operation return value
 * @template TData - data passed from the main thread to the worker during initialization
 * @returns {Operation<WorkerResource<TSend, TRecv>>}
 */
export function useWorker<TSend, TRecv, TReturn, TData>(
  url: string | URL,
  options?: WorkerOptions & { data?: TData },
): Operation<WorkerResource<TSend, TRecv, TReturn>> {
  return resource(function* (provide) {
    let outcome = withResolvers<TReturn>();
    let outcomeSettled = false;

    const resolveOutcome = (value: TReturn) => {
      if (outcomeSettled) {
        return;
      }
      outcomeSettled = true;
      outcome.resolve(value);
    };

    const rejectOutcome = (error: Error) => {
      if (outcomeSettled) {
        return;
      }
      outcomeSettled = true;
      outcome.reject(error);
    };

    let worker = new Worker(url, options);
    let subscription = yield* on(worker, "message");

    // Channel for worker-initiated requests (buffered via eager subscription)
    const requests = createChannel<
      { value: unknown; response: MessagePort },
      void
    >();
    // Subscribe immediately so messages buffer before forEach is called
    const requestSubscription = yield* requests;

    // Flags for forEach state
    let forEachInProgress = false;
    let forEachCompleted = false;
    let opened = false;

    // Signal for when worker is ready (received "open" message)
    const ready = withResolvers<void>();

    // Spawned message loop - handles incoming messages using each pattern
    yield* spawn(function* () {
      while (true) {
        const next = yield* subscription.next();
        if (next.done) {
          break;
        }

        const msg = next.value.data;
        if (!opened && msg.type !== "open") {
          const error = new Error(
            `expected first message to arrive from worker to be of type "open", but was: ${msg.type}`,
          );
          ready.reject(error);
          throw error;
        }

        if (msg.type === "open") {
          opened = true;
          ready.resolve();
        } else if (msg.type === "close") {
          const { result } = msg as { result: Result<TReturn> };
          if (result.ok) {
            resolveOutcome(result.value);
          } else {
            const serializedError = result.error as unknown as SerializedError;
            rejectOutcome(
              errorFromSerialized("Worker failed", serializedError),
            );
          }
          // Close channel so forEach terminates naturally
          yield* requests.close(undefined);
        } else if (msg.type === "request") {
          yield* requests.send({ value: msg.value, response: msg.response });
        }
      }

      if (!opened) {
        const error = new Error(
          "worker terminated before sending open message",
        );
        ready.reject(error);
        throw error;
      }
    });

    // Wait for "open" message before proceeding
    yield* ready.operation;

    // Handle worker errors
    yield* spawn(function* () {
      let event = yield* once(worker, "error");
      event.preventDefault();
      throw event.error;
    });

    yield* ensure(function* () {
      worker.postMessage({ type: "close" });
      if (!outcomeSettled) {
        while (!outcomeSettled) {
          const event = yield* once(worker, "message");
          const msg = event.data;
          if (msg.type === "close") {
            const { result } = msg as { result: Result<TReturn> };
            if (result.ok) {
              resolveOutcome(result.value);
            } else {
              const serializedError =
                result.error as unknown as SerializedError;
              rejectOutcome(
                errorFromSerialized("Worker failed", serializedError),
              );
            }
          }
        }
      }
      yield* settled(outcome.operation);
    });

    worker.postMessage({
      type: "init",
      data: options?.data,
    });

    yield* provide({
      *send(value) {
        const response = yield* useChannelResponse<TRecv>();
        worker.postMessage(
          {
            type: "send",
            value,
            response: response.port,
          },
          [response.port],
        );
        const result = yield* response;
        if (result.ok) {
          return result.value;
        }
        throw errorFromSerialized("Worker handler failed", result.error);
      },

      *forEach<WRequest, WResponse, WProgress = never>(
        fn: (
          request: WRequest,
          ctx: ForEachContext<WProgress>,
        ) => Operation<WResponse>,
      ): Operation<TReturn> {
        // Prevent calling forEach more than once
        if (forEachCompleted) {
          throw new Error("forEach has already completed");
        }

        // Prevent concurrent forEach
        if (forEachInProgress) {
          throw new Error("forEach is already in progress");
        }
        forEachInProgress = true;

        try {
          // Iterate until channel closes (when worker sends "close")
          let next = yield* requestSubscription.next();
          while (!next.done) {
            const request = next.value;
            // Track handler errors - we forward to worker but also re-throw to host
            let handlerError: Error | undefined;

            // Create a task for this request and wait for it to complete
            const task = yield* spawn(function* () {
              const channelRequest = yield* useChannelRequest<
                WResponse,
                WProgress
              >(request.response);
              try {
                // Create context with progress method
                const ctx: ForEachContext<WProgress> = {
                  progress: (data: WProgress) => channelRequest.progress(data),
                };
                const result = yield* fn(request.value as WRequest, ctx);
                yield* channelRequest.resolve(result);
              } catch (error) {
                // Forward error to worker so it knows the request failed
                yield* channelRequest.reject(error as Error);
                // Store error to re-throw after forwarding (don't swallow host errors)
                handlerError = error as Error;
              }
            });

            // Wait for the handler to complete
            yield* task;

            // If the handler failed, stop processing and re-throw
            if (handlerError) {
              throw handlerError;
            }
            next = yield* requestSubscription.next();
          }
          return yield* outcome.operation;
        } finally {
          forEachInProgress = false;
          forEachCompleted = true;
        }
      },

      [Symbol.iterator]: outcome.operation[Symbol.iterator],
    });
  });
}

function settled<T>(operation: Operation<T>): Operation<Result<void>> {
  return {
    *[Symbol.iterator]() {
      try {
        yield* operation;
        return Ok(void 0);
      } catch (error) {
        return Err(error as Error);
      }
    },
  };
}
