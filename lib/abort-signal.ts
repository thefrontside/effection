import type { Operation } from "./types.ts";
import { resource } from "./instructions.ts";

/**
 * Create an
 * [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
 * bound to the current scope. Whenever that scope is completed,
 * errored, or halted, the abort signal will be triggered.
 *
 * Cancellation and teardown is handled automatically in Effection,
 * but in systems where it is not, the lifespan of a transaction needs
 * to be explicitly modeled. A very common way to do this is with the
 * `AbortSignal`. By creating an abort signal bound to an Effection
 * scope, we can pass that signal down to 3rd party consumers that can
 * use it to register shutdown callbacks that will be invoked whenever
 * the task is done (either by completion, failure, or
 * cancellation). An example is the native
 * [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch#syntax)
 * API which takes a `signal` parameter in order to trigger when the
 * HTTP request should be cancelled.  This is how you would bind the
 * lifetime of the HTTP request to the lifetime of the current task.
 *
 * @example
 * ```js
 * function* request() {
 *   let signal = yield* useAbortSignal();
 *   return yield* fetch('/some/url', { signal });
 * }
 * ```
 */
export function useAbortSignal(): Operation<AbortSignal> {
  return resource(function* AbortSignal(provide) {
    let controller = new AbortController();
    try {
      yield* provide(controller.signal);
    } finally {
      controller.abort();
    }
  });
}
