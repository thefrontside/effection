import { createContext } from "./context.ts";
import { Priority } from "./contexts.ts";
import { SettleContext } from "./coroutine.ts";
import { Just } from "./maybe.ts";
import { PriorityQueue } from "./priority-queue.ts";
import { Err, Ok } from "./result.ts";
import type { Coroutine, Effect } from "./types.ts";

export class Reducer {
  reducing = false;
  readonly queue = new InstructionQueue();

  schedule = (routine: Coroutine) => {
    let { queue } = this;

    queue.enqueue(routine, routine.scope.expect(Priority));

    if (this.reducing) return;

    try {
      this.reducing = true;

      for (let routine = queue.dequeue(); routine; routine = queue.dequeue()) {
        try {
          let next: IteratorResult<Effect<unknown>, unknown> = routine.step();

          if (next.done) {
            let settle = routine.scope.expect(SettleContext);
            settle(Just(Ok(next.value)), routine.settle);
          } else {
            routine.perform(next.value);
          }
        } catch (error) {
          let settle = routine.scope.expect(SettleContext);
          settle(Just(Err(error as Error)), routine.settle);
        }
      }
    } finally {
      this.reducing = false;
    }
  };
}

class InstructionQueue extends PriorityQueue<Coroutine> {
  enqueue(routine: Coroutine, priority: number): void {
    if (!routine.data.enqueued) {
      routine.data.enqueued = true;
      this.push(priority, routine);
    }
  }
  dequeue(): Coroutine | undefined {
    let routine = this.pop();
    if (routine) {
      routine.data.enqueued = false;
      return routine;
    }
  }
}

export const ReducerContext = createContext<Reducer>(
  "@effection/reducer",
  new Reducer(),
);
