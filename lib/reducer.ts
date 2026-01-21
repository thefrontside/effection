import { createContext } from "./context.ts";
import { PriorityQueue } from "./priority-queue.ts";
import { Err, type Result } from "./result.ts";
import type { Coroutine } from "./types.ts";

export class Reducer {
  reducing = false;
  readonly queue = new InstructionQueue();

  reduce = (
    instruction: Instruction,
  ) => {
    let { queue } = this;

    queue.enqueue(instruction);

    if (this.reducing) return;

    try {
      this.reducing = true;

      let item = queue.dequeue();
      while (item) {
        let [, routine, result, _, method = "next" as const] = item;
        try {
          let iterator = routine.data.iterator;
          if (result.ok) {
            if (method === "next") {
              let next = iterator.next(result.value);
              if (!next.done) {
                let action = next.value;
                routine.data.exit = action.enter(routine.next, routine);
              }
            } else if (iterator.return) {
              let next = iterator.return(result.value);
              if (!next.done) {
                let action = next.value;
                routine.data.exit = action.enter(routine.next, routine);
              }
            }
          } else if (iterator.throw) {
            let next = iterator.throw(result.error);
            if (!next.done) {
              let action = next.value;
              routine.data.exit = action.enter(routine.next, routine);
            }
          } else {
            throw result.error;
          }
        } catch (error) {
          routine.next(Err(error as Error));
        }
        item = queue.dequeue();
      }
    } finally {
      this.reducing = false;
    }
  };
}

type Instruction = [
  number,
  Coroutine<unknown>,
  Result<unknown>,
  () => boolean,
  "return" | "next",
];

class InstructionQueue extends PriorityQueue<Instruction> {
  enqueue(instruction: Instruction): void {
    let [priority] = instruction;
    this.push(priority, instruction);
  }
  dequeue(): Instruction | undefined {
    while (true) {
      let top = this.pop();
      if (!top) {
        return undefined;
      } else {
        let validate = top[3];
        if (!validate()) {
          continue;
        }
        return top;
      }
    }
  }
}

export const ReducerContext = createContext<Reducer>(
  "@effection/reducer",
  new Reducer(),
);
