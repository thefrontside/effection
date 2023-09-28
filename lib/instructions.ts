import type {
  Frame,
  Instruction,
  Operation,
  Provide,
  Reject,
  Resolve,
  Result,
  Task,
} from "./types.ts";

import { reset, shift } from "./deps.ts";
import { shiftSync } from "./shift-sync.ts";
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
  return instruction(Suspend);
}

function Suspend(frame: Frame) {
  return shiftSync<Result<void>>((k) => {
    if (frame.aborted) {
      k.tail(Ok(void 0));
    }
  });
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
  return instruction(function Action(frame) {
    return shift<Result<T>>(function* (k) {
      let settle = yield* reset<Resolve<Result<T>>>(function* () {
        let result = yield* shiftSync<Result<T>>((k) => k.tail);

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
  });
}

/**
 * An operation that runs another operation concurrently as a child.
 *
 * The spawned operation will begin executing immediately and control will
 * return to the caller when it reaches its first suspend point.
 *
 * ### Example
 *
 * ```typescript
 * import { main, sleep, suspend, spawn } from 'effection';
 *
 * await main(function*() {
 *   yield* spawn(function*() {
 *     yield* sleep(1000);
 *     console.log("hello");
 *   });
 *   yield* spawn(function*() {
 *     yield* sleep(2000);
 *     console.log("world");
 *   });
 *   yield* suspend();
 * });
 * ```
 *
 * You should prefer using the spawn operation over calling
 * {@link Scope.run} from within Effection code. The reason being that a
 * synchronous failure in the spawned operation will not be caught
 * until the next yield point when using `run`, which results in lines
 * being executed that should not.
 *
 * ### Example
 *
 * ```typescript
 * import { main, suspend, spawn, useScope } from 'effection';
 *
 * await main(function*() {
 *   yield* useScope();
 *
 *   scope.run(function*() {
 *    throw new Error('boom!');
 *   });
 *
 *   console.log('this code will run and probably should not');
 *
 *   yield* suspend(); // <- error is thrown after this.
 * });
 * ```
 * @param operation the operation to run as a child of the current task
 * @typeParam T the type that the spawned task evaluates to
 * @returns a {@link Task} representing a handle to the running operation
 */
export function spawn<T>(operation: () => Operation<T>): Operation<Task<T>> {
  return instruction(function Spawn(frame) {
    return shift<Result<Task<T>>>(function (k) {
      let child = frame.createChild<T>(operation);

      child.enter();

      k.tail(Ok(child.getTask()));

      return reset(function* () {
        let result = yield* child;
        if (!result.ok) {
          yield* frame.crash(result.error);
        }
      });
    });
  });
}

export function resource<T>(
  operation: (provide: Provide<T>) => Operation<void>,
): Operation<T> {
  return instruction((frame) =>
    shift<Result<T>>(function (k) {
      function provide(value: T) {
        k.tail(Ok(value));
        return suspend();
      }

      let child = frame.createChild(() => operation(provide));

      child.enter();

      return reset(function* () {
        let result = yield* child;
        if (!result.ok) {
          k.tail(result);
          yield* frame.crash(result.error);
        }
      });
    })
  );
}

export function getframe(): Operation<Frame> {
  return instruction((frame) =>
    shiftSync<Result<Frame>>((k) => k.tail(Ok(frame)))
  );
}

// An optimized iterator that yields the instruction on the first call
// to next, then returns its value on the second. Equivalent to:
// {
//  *[Symbol.iterator]() { return yield instruction; }
// }
function instruction<T>(i: Instruction): Operation<T> {
  return {
    [Symbol.iterator]() {
      let entered = false;
      return {
        next(value) {
          if (!entered) {
            entered = true;
            return { done: false, value: i };
          } else {
            return { done: true, value };
          }
        },
        throw(error) {
          throw error;
        },
      };
    },
  };
}
