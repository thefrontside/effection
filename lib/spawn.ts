import { Ok } from "./result.ts";
import { ScopeInternal } from "./scope.ts";
import { createTask, NewTask } from "./task.ts";
import type { Effect, Operation, Task } from "./types.ts";

export function* spawn<T>(op: () => Operation<T>): Operation<Task<T>> {
  let { task, start } = (yield Spawn(op)) as NewTask<T>;
  start();
  return task;
}

function Spawn<T>(operation: () => Operation<T>): Effect<NewTask<T>> {
  return {
    description: `spawn(${operation.name})`,
    enter: (resolve, { scope }) => {
      resolve(Ok(createTask({ owner: scope as ScopeInternal, operation })));
      return (done) => {
        done(Ok());
      };
    },
  };
}
