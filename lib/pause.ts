import type { Operation, Reject, Resolve, Result } from "./types.ts";
import { Err, Ok } from "./result.ts";
import { shift } from "./deps.ts";

export function* pause<T>(
  install: (resolve: Resolve<T>, reject: Reject) => Resolve<void>,
): Operation<T> {
  let uninstall = () => {};
  try {
    return yield function pause_i() {
      return shift<Result<T>>(function* (k) {
        let resolve = (value: T) => k.tail(Ok(value));
        let reject = (error: Error) => k.tail(Err(error));
        uninstall = install(resolve, reject);
      });
    };
  } finally {
    if (uninstall) {
      uninstall();
    }
  }
}
