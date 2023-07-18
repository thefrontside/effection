import type {
  Frame,
  Operation,
  Provide,
  Reject,
  Resolve,
  Result,
  Task,
} from "./types.ts";

import { reset, shift } from "./deps.ts";
import { Err, Ok } from "./result.ts";

/**
 * Indefinitely pause execution of the current operation. It is typically
 * used in conjunction with an {@link action} to mark the boundary
 * between setup and teardown.
 *
 * ```js
 * function onEvent(listener, name) {
 *   return action(function* (resolve) {
 *     try {
 *       listener.addEventListener(name, resolve);
 *       yield* suspend();
 *     } finally {
 *       listener.removeEventListener(name, resolve);
 *     }
 *   });
 * }
 * ```
 *
 * An operation will remain suspended until its enclosing scope is destroyed,
 * at which point it proceeds as though return had been called from the point
 * of suspension. Once an operation suspends once, further suspend operations
 * are ignored.
 *
 * @returns an operation that suspends the current operation
 */
export function suspend(): Operation<void> {
  return {
    *[Symbol.iterator]() {
      return yield function Suspend(_, signal) {
        return shift<Result<void>>(function* (k) {
          if (signal.aborted) {
            k.tail(Ok(void 0));
          }
        });
      };
    },
  };
}

/**
 * Create an {@link Operation} that can be either resolved (or rejected) with
 * a synchronous callback. This is the Effection equivalent of `new Promise()`.
 *
 * The action body is itself an operation that runs in a new scope that is
 * destroyed completely before program execution returns to the point where the
 * action was yielded to.
 *
 * For example:
 *
 * ```js
 * let five = yield* action(function*(resolve, reject) {
 *   setTimeout(() => {
 *     if (Math.random() > 5) {
 *       resolve(5)
 *     } else {
 *       reject(new Error("bad luck!"));
 *     }
 *   }, 1000);
 * });
 *
 * ```
 *
 * However, it is customary to explicitly {@link suspend} inside the body of the
 * action so that whenever the action resolves, appropriate cleanup code can
 * run. The preceeding example would be more correctly written as:
 *
 * ```js
 * let five = yield* action(function*(resolve) {
 *   let timeoutId = setTimeout(() => {
 *     if (Math.random() > 5) {
 *       resolve(5)
 *     } else {
 *       reject(new Error("bad luck!"));
 *     }
 *   }, 1000);
 *   try {
 *     yield* suspend();
 *   } finally {
 *     clearTimout(timeoutId);
 *   }
 * });
 * ```
 *
 * @typeParam T - type of the action's result.
 * @param operation - body of the action
 * @returns an operation producing the resolved value, or throwing the rejected error
 */
export function action<T>(
  operation: (resolve: Resolve<T>, reject: Reject) => Operation<void>,
): Operation<T> {
  return {
    *[Symbol.iterator]() {
      return yield function Action(frame) {
        return shift<Result<T>>(function* (k) {
          let settle = yield* reset<Resolve<Result<T>>>(function* () {
            let result = yield* shift<Result<T>>(function* (k) {
              return k.tail;
            });

            let destruction = yield* child.destroy();

            if (!destruction.ok) {
              k.tail(destruction);
            } else {
              k.tail(result);
            }
          });

          let resolve: Resolve<T> = (value) => settle(Ok(value));
          let reject: Reject = (error) => settle(Err(error));

          let child = frame.createChild(function* () {
            yield* operation(resolve, reject);
            yield* suspend();
          });

          yield* reset(function* () {
            let result = yield* child;
            if (!result.ok) {
              k.tail(result);
            }
          });

          child.enter();
        });
      };
    },
  };
}

export function spawn<T>(operation: () => Operation<T>): Operation<Task<T>> {
  return {
    *[Symbol.iterator]() {
      return yield function Spawn(frame) {
        return shift<Result<Task<T>>>(function* (k) {
          let child = frame.createChild<T>(operation);

          yield* reset(function* () {
            let result = yield* child;
            if (!result.ok) {
              yield* frame.crash(result.error);
            }
          });

          let task = child.enter();

          k.tail(Ok(task));
        });
      };
    },
  };
}

export function resource<T>(
  operation: (provide: Provide<T>) => Operation<void>,
): Operation<T> {
  return {
    *[Symbol.iterator]() {
      return yield (frame) =>
        shift<Result<T>>(function* (k) {
          function* provide(value: T) {
            k.tail(Ok(value));
            yield* suspend();
          }

          let child = frame.createChild(() => operation(provide));
          yield* reset(function* () {
            let result = yield* child;
            if (!result.ok) {
              k.tail(result);
              yield* frame.crash(result.error);
            }
          });
          child.enter();
        });
    },
  };
}

export function getframe(): Operation<Frame> {
  return {
    *[Symbol.iterator]() {
      return yield (frame) =>
        shift<Result<Frame>>(function* (k) {
          k.tail(Ok(frame));
        });
    },
  };
}
