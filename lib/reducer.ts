import { createContext } from "./context.ts";
import type { Delimiter } from "./delimiter.ts";
import { PriorityQueue } from "./priority-queue.ts";
import { Err, type Result } from "./result.ts";
import type { Coroutine, Effect } from "./types.ts";

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

      for (let item = queue.dequeue(); item; item = queue.dequeue()) {
        let [, routine, result, delim, epoch] = item;
        let step = delim.nextStep(result, epoch);
        if (step === "drop") continue;
        try {
          let iterator = routine.data.iterator;
          let next: IteratorResult<Effect<unknown>, unknown>;
          if (step === "next") {
            next = iterator.next(result.ok ? result.value : undefined);
          } else if (step === "return") {
            next = iterator.return
              ? iterator.return(result.ok ? result.value : undefined)
              : { done: true, value: undefined };
          } else {
            let value = result.ok ? result.value : result.error;
            if (iterator.throw) {
              next = iterator.throw(value);
            } else {
              throw value;
            }
          }
          if (!next.done) {
            let action = next.value;
            routine.data.exit = action.enter(routine.next, routine);
          }
        } catch (error) {
          routine.next(Err(error as Error));
        }
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
  Delimiter<unknown>,
  number,
];

class InstructionQueue extends PriorityQueue<Instruction> {
  enqueue(instruction: Instruction): void {
    let [priority] = instruction;
    this.push(priority, instruction);
  }
  dequeue(): Instruction | undefined {
    return this.pop();
  }
}

export const ReducerContext = createContext<Reducer>(
  "@effection/reducer",
  new Reducer(),
);
