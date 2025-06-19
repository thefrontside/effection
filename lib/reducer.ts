import { createContext } from "./context.ts";
import { PriorityQueue } from "./priority-queue.ts";
import { Err, type Result } from "./result.ts";
import type { Coroutine } from "./types.ts";

export class Reducer {
  reducing = false;
  readonly queue = new InstructionQueue();

  reduce = (
    thunk: Thunk,
  ) => {
    let { queue } = this;

    queue.enqueue(thunk);

    if (this.reducing) return;

    try {
      this.reducing = true;

      let item = queue.dequeue();
      while (item) {
        let [, routine, result, _, method = "next" as const] = item;
        try {
          const iterator = routine.data.iterator;
          if (result.ok) {
            if (method === "next") {
              let next = iterator.next(result.value);
              console.log({ next });
              if (!next.done) {
                let action = next.value;
                routine.data.exit = action.enter(routine.next, routine);
              }
            } else if (iterator.return) {
              let next = iterator.return(result.value);
              console.log({ return: next });
              if (!next.done) {
                let action = next.value;
                routine.data.exit = action.enter(routine.next, routine);
              }
            }
          } else if (iterator.throw) {
            let next = iterator.throw(result.error);
            console.log({ throw: next });
            if (!next.done) {
              let action = next.value;
              routine.data.exit = action.enter(routine.next, routine);
            }
          } else {
            throw result.error;
          }
        } catch (error) {
          console.log({ reducer: error });
          routine.next(Err(error as Error));
        }
        item = queue.dequeue();
      }
    } finally {
      this.reducing = false;
    }
  };
}



type Thunk = [
  number,
  Coroutine<unknown>,
  Result<unknown>,
  () => void,
  "return" | "next",
  number,
];

class InstructionQueue extends PriorityQueue<Thunk> {
  enqueue(thunk: Thunk): void {
    let [priority] = thunk;
    this.push(priority, thunk);
  }
  dequeue(): Thunk | undefined {
    while (true) {
      let top = this.pop();
      if (!top) {
        return undefined;
      } else if (top[5] < top[1].runLevel) {
        continue;
      } else {
        return top;
      }
    }
  }
}

export const ReducerContext = createContext<Reducer>(
  "@effection/reducer",
  new Reducer(),
);
