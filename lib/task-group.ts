import { createContext } from "./context.ts";
import { box } from "./box.ts";
import { Ok, unbox } from "./result.ts";
import type { Operation, Task } from "./types.ts";

export class TaskGroup {
  tasks = new Set<Task<unknown>>();

  add(task: Task<unknown>) {
    this.tasks.add(task);
  }

  delete(task: Task<unknown>) {
    this.tasks.delete(task);
  }

  *halt(): Operation<void> {
    let total = Ok();
    while (this.tasks.size > 0) {
      let tasks = [...this.tasks].reverse();
      this.tasks.clear();
      for (let task of tasks) {
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
      yield* group.halt();
    }
  });
}
