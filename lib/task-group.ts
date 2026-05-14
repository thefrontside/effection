import { createContext } from "./context.ts";
import { box } from "./box.ts";
import { Ok, unbox } from "./result.ts";
import type { Operation, Task } from "./types.ts";
import { critical } from "./coroutine.ts";

export class TaskGroup {
  tasks = new Set<Task<unknown>>();

  *halt() {
    let set = this.tasks;
    let total = Ok();
    while (set.size > 0) {
      let tasks = [...set];
      set.clear();
      for (let i = tasks.length - 1; i >= 0; i--) {
        let task = tasks[i];
        let result = yield* box(task.halt);
        if (!result.ok) {
          total = result;
        }
      }
    }
    unbox(total);
  }
}

export const TaskGroupContext = createContext<TaskGroup>(
  "@effection/task-group",
  new TaskGroup(),
);

export function encapsulate<T>(operation: () => Operation<T>): Operation<T> {
  return TaskGroupContext.with(new TaskGroup(), function* (group) {
    try {
      return yield* operation();
    } finally {
      yield* critical(() => group.halt());
    }
  });
}
