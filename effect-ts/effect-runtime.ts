import { type Effect, Exit, Layer, ManagedRuntime } from "effect";
import { type Operation, action, ensure, resource, until } from "effection";

/**
 * A runtime for executing Effect programs inside Effection operations.
 *
 * @typeParam R - The services/context provided by this runtime (from the layer)
 */
export interface EffectRuntime<R = never> {
  /**
   * Run an Effect program and return its result as an Effection Operation.
   *
   * Effect failures will be thrown as JavaScript errors.
   *
   * @param effect - The Effect program to run
   * @returns An Operation that yields the Effect's success value
   * @throws The Effect's error `E` if it fails
   *
   * @example
   * ```ts
   * const runtime = yield* makeEffectRuntime();
   * const result = yield* runtime.run(Effect.succeed(42));
   * // result = 42
   * ```
   */
  run<A, E>(effect: Effect.Effect<A, E, R>): Operation<A>;

  /**
   * Run an Effect program and return its Exit (success or failure).
   *
   * Unlike `run()`, this does not throw on failure. Instead, it returns
   * an `Exit<A, E>` that you can inspect to determine success or failure.
   * This preserves Effect's full error model including the Cause.
   *
   * @param effect - The Effect program to run
   * @returns An Operation that yields the Effect's Exit
   *
   * @example
   * ```ts
   * const runtime = yield* makeEffectRuntime();
   * const exit = yield* runtime.runExit(Effect.fail(new Error("boom")));
   * if (Exit.isFailure(exit)) {
   *   console.log(exit.cause); // Full Cause<E> with error details
   * } else {
   *   console.log(exit.value); // Success value
   * }
   * ```
   */
  runExit<A, E>(effect: Effect.Effect<A, E, R>): Operation<Exit.Exit<A, E>>;
}

/**
 * Create an EffectRuntime resource that manages an Effect ManagedRuntime.
 *
 * The ManagedRuntime is automatically disposed when the Effection scope ends,
 * ensuring proper cleanup of Effect resources.
 *
 * @param layer - Optional Effect Layer to provide services. Defaults to `Layer.empty`.
 *                Users can compose multiple layers using Effect's `Layer.merge()`,
 *                `Layer.mergeAll()`, or `Layer.provide()` before passing.
 * @returns An Operation that yields the EffectRuntime
 *
 * @example Basic usage
 * ```ts
 * import { run } from "effection";
 * import { Effect } from "effect";
 * import { makeEffectRuntime } from "@effectionx/effect";
 *
 * await run(function* () {
 *   const runtime = yield* makeEffectRuntime();
 *   const result = yield* runtime.run(Effect.succeed(42));
 *   console.log(result); // 42
 * });
 * ```
 *
 * @example With services
 * ```ts
 * import { Layer, Context, Effect } from "effect";
 *
 * class Logger extends Context.Tag("Logger")<Logger, { log: (msg: string) => Effect.Effect<void> }>() {}
 * const LoggerLive = Layer.succeed(Logger, { log: (msg) => Effect.log(msg) });
 *
 * await run(function* () {
 *   const runtime = yield* makeEffectRuntime(LoggerLive);
 *   yield* runtime.run(Effect.gen(function* () {
 *     const logger = yield* Logger;
 *     yield* logger.log("Hello!");
 *   }));
 * });
 * ```
 *
 * @example Composing multiple layers
 * ```ts
 * const AppLayer = Layer.mergeAll(DatabaseLive, LoggerLive, CacheLive);
 * const runtime = yield* makeEffectRuntime(AppLayer);
 * ```
 */
export function makeEffectRuntime<R = never>(
  layer?: Layer.Layer<R, never, never>,
): Operation<EffectRuntime<R>> {
  return resource<EffectRuntime<R>>(function* (provide) {
    const managedRuntime = ManagedRuntime.make(
      layer ?? Layer.empty,
    ) as ManagedRuntime.ManagedRuntime<R, never>;

    interface PendingExecution {
      abort: () => void;
      settled: Promise<void>;
    }

    const pending = new Set<PendingExecution>();

    function startManaged<T>(runPromise: (signal: AbortSignal) => Promise<T>) {
      const controller = new AbortController();
      let done = false;

      const execution = {
        abort: () => {
          if (!done) {
            controller.abort();
          }
        },
        settled: Promise.resolve(),
      } as PendingExecution;

      const promise = runPromise(controller.signal);

      execution.settled = promise
        .then(
          () => undefined,
          () => undefined,
        )
        .finally(() => {
          done = true;
          pending.delete(execution);
        });

      pending.add(execution);

      return { promise, abort: execution.abort, signal: controller.signal };
    }

    const run: EffectRuntime<R>["run"] = <A, E>(
      effect: Effect.Effect<A, E, R>,
    ) => {
      return action<A>((resolve, reject) => {
        const { promise, abort, signal } = startManaged((signal) =>
          managedRuntime.runPromise(effect, { signal }),
        );

        promise.then(resolve, (error) => {
          if (!signal.aborted) {
            reject(error);
          }
        });
        return abort;
      });
    };

    const runExit: EffectRuntime<R>["runExit"] = <A, E>(
      effect: Effect.Effect<A, E, R>,
    ) => {
      return action<Exit.Exit<A, E>>((resolve, _reject) => {
        const { promise, abort, signal } = startManaged((signal) =>
          managedRuntime.runPromiseExit(effect, { signal }),
        );

        promise.then(resolve, (error) => {
          if (!signal.aborted) {
            resolve(Exit.die(error) as Exit.Exit<A, E>);
          }
        });
        return abort;
      });
    };

    yield* ensure(function* () {
      const active = Array.from(pending);
      for (const execution of active) {
        execution.abort();
      }

      yield* until(Promise.all(active.map((execution) => execution.settled)));
      yield* until(managedRuntime.dispose());
    });

    yield* provide({ run, runExit });
  });
}
