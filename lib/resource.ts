import { suspend } from "./suspend.ts";
import { spawn } from "./spawn.ts";
import { Operation } from "./types.ts";
import { trap } from "./task.ts";
import { Ok } from "./result.ts";
import { useCoroutine } from "./coroutine.ts";

export interface Provide<T> {
  (value: T): Operation<void>;
}

export function resource<T>(
  op: (provide: Provide<T>) => Operation<void>,
): Operation<T> {
  return {
    *[Symbol.iterator]() {
      let caller = yield* useCoroutine();

      function* provide(value: T): Operation<void> {
        caller.next(Ok(value));
        yield* suspend();
      }

      // establishing a control boundary lets us catch errors in
      // resource initializer
      return yield* trap<T>(function* () {
        yield* spawn(() => op(provide));
        return (yield {
          description: "await resource",
          enter: () => (uninstalled) => uninstalled(Ok()),
        }) as T;
      });
    },
  };
}
