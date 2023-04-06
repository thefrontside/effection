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
import { createFrameTask } from "./run/frame.ts";
import { Err, Ok } from "./result.ts";

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

          let child = frame.createChild();
          let block = child.run(() => operation(resolve, reject));

          yield* reset(function* () {
            let result = yield* child;
            if (!result.ok) {
              k.tail(result);
            }
          });

          yield* reset(function* () {
            let blockResult = yield* block;
            if (!blockResult.result.ok) {
              settle(blockResult.result);
            }
          });

          block.enter();
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
          let child = frame.createChild();
          let block = child.run(operation);

          let task = createFrameTask(child, block);

          yield* reset(function* () {
            let blockResult = yield* block;
            let destruction = yield* child.destroy();
            if (!destruction.ok) {
              yield* frame.crash(destruction.error);
            } else if (
              blockResult.aborted &&
              !blockResult.result.ok
            ) {
              yield* frame.crash(blockResult.result.error);
            } else if (!blockResult.result.ok) {
              yield* frame.crash(blockResult.result.error);
            }
          });

          block.enter();

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
      return yield function Resource(frame) {
        return shift<Result<T>>(function* (k) {
          let child = frame.createChild();
          let provide = (value: T): Operation<void> => {
            return {
              *[Symbol.iterator]() {
                return yield () =>
                  shift<Result<void>>(function* () {
                    k.tail(Ok(value));
                  });
              },
            };
          };
          yield* reset(function* () {
            let result = yield* child;
            if (!result.ok) {
              yield* frame.crash(result.error);
            }
          });
          let block = child.run(() => operation(provide));

          yield* reset(function* () {
            let done = yield* block;
            if (!done.result.ok) {
              k.tail(done.result);
            } else if (done.result.ok) {
              let err = new Error(
                `resource exited without ever providing anything`,
              );
              k.tail(Err(err));
            }
          });

          block.enter();
        });
      };
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
