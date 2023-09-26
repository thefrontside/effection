import type { Frame, Future, Reject, Resolve, Result, Task } from "../types.ts";
import type { Computation } from "../deps.ts";

import { evaluate } from "../deps.ts";
import { Err } from "../result.ts";
import { action } from "../instructions.ts";

import type { FrameResult } from "./types.ts";
import { create } from "./create.ts";

export function createTask<T>(
  frame: Frame<T>,
  results: Computation<FrameResult<T>>,
): Task<T> {
  let promise: Promise<T>;

  let awaitResult = (resolve: Resolve<T>, reject: Reject) => {
    evaluate(function* () {
      let result = getResult(yield* results);

      if (result.ok) {
        resolve(result.value);
      } else {
        reject(result.error);
      }
    });
  };

  let getPromise = () => {
    promise = new Promise<T>((resolve, reject) => {
      awaitResult(resolve, reject);
    });
    getPromise = () => promise;
    return promise;
  };

  let task = create<Task<T>>("Task", {}, {
    *[Symbol.iterator]() {
      let frameResult = evaluate<FrameResult<T> | void>(() => results);
      if (frameResult) {
        let result = getResult(frameResult);
        if (result.ok) {
          return result.value;
        } else {
          throw result.error;
        }
      } else {
        return yield* action<T>(function* (resolve, reject) {
          awaitResult(resolve, reject);
        });
      }
    },
    then: (...args) => getPromise().then(...args),
    catch: (...args) => getPromise().catch(...args),
    finally: (...args) => getPromise().finally(...args),
    halt() {
      let haltPromise: Promise<void>;
      let getHaltPromise = () => {
        haltPromise = new Promise((resolve, reject) => {
          awaitHaltResult(resolve, reject);
        });
        getHaltPromise = () => haltPromise;
        frame.destroy();
        return haltPromise;
      };
      let awaitHaltResult = (resolve: Resolve<void>, reject: Reject) => {
        evaluate(function* () {
          let result = yield* results;
          if (result.ok) {
            resolve(result.value);
          } else {
            reject(result.error);
          }
        });
      };
      return create<Future<void>>("Future", {}, {
        *[Symbol.iterator]() {
          let result = evaluate<FrameResult<T> | void>(() => results);

          if (result) {
            if (!result.ok) {
              throw result.error;
            }
          } else {
            yield* action<void>(function* (resolve, reject) {
              awaitHaltResult(resolve, reject);
              frame.destroy();
            });
          }
        },
        then: (...args) => getHaltPromise().then(...args),
        catch: (...args) => getHaltPromise().catch(...args),
        finally: (...args) => getHaltPromise().finally(...args),
      });
    },
  });
  return task;
}

function getResult<T>(result: FrameResult<T>): Result<T> {
  if (!result.ok) {
    return result;
  } else if (result.exit.type === "aborted") {
    return Err(Error("halted"));
  } else if (result.exit.type === "crashed") {
    return Err(result.exit.error);
  } else {
    return result.exit.result;
  }
}
