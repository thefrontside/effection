import { spawn } from './operations/spawn';
import { Resource } from "./operation";
import { AbortController, AbortSignal } from 'abort-controller';

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
 * task, we can pass that signal down to 3rd party consumers that can
 * use it to register shutdown callbacks that will be invoked whenever
 * the task is done (either by completion, failure, or
 * cancellation). An example is the native
 * [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch#syntax)
 * API which takes a `signal` parameter in order to trigger when the
 * HTTP request should be cancelled.  This is how you would bind the
 * lifetime of the HTTP request to the lifetime of the current task.
 *
 * ```js
 * function* request() {
 *   let signal = yield createAbortSignal();
 *   return yield fetch('/some/url', { signal });
 * }
 * ```
 */
function createAbortSignal(): Resource<AbortSignal> {
  return {
    name: 'AbortSignal',
    *init() {
      let controller = new AbortController();
      yield spawn(function* () {
        try {
          yield;
        } finally {
          controller.abort();
        }
      }, {
        labels: {
          name: 'ensure signal aborted'
        }
      });
      return controller.signal;
    }
  };
}

export { createAbortSignal, AbortSignal };
