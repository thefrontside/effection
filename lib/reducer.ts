import { createContext } from "./context.ts";
import { PriorityQueue } from "./priority-queue.ts";
import { Err, Ok, type Result } from "./result.ts";
import type { Coroutine, Subscriber } from "./types.ts";

export class Reducer {
  reducing = false;
  readonly queue = createPriorityQueue2();

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
        let [, routine, result, notify, method = "next" as const] = item;
        try {
          notify({ done: false, value: result });
          const iterator = routine.data.iterator;
          if (result.ok) {
            if (method === "next") {
              let next = iterator.next(result.value);
              if (next.done) {
                notify({ done: true, value: Ok(next.value) });
              } else {
                let action = next.value;
                routine.data.discard = action.enter(routine.next, routine);
              }
            } else if (iterator.return) {
              let next = iterator.return(result.value);
              if (next.done) {
                notify({ done: true, value: Ok(result) });
              } else {
                let action = next.value;
                routine.data.discard = action.enter(routine.next, routine);
              }
            } else {
              notify({ done: true, value: result });
            }
          } else if (iterator.throw) {
            let next = iterator.throw(result.error);
            if (next.done) {
              notify({ done: true, value: Ok(next.value) });
            } else {
              let action = next.value;
              routine.data.discard = action.enter(routine.next, routine);
            }
          } else {
            throw result.error;
          }
        } catch (error) {
          notify({ done: true, value: Err(error as Error) });
        }
        item = queue.dequeue();
      }
    } finally {
      this.reducing = false;
    }
  };
}

export const ReducerContext = createContext<Reducer>(
  "@effection/reducer",
  new Reducer(),
);

type Thunk = [
  number,
  Coroutine<unknown>,
  Result<unknown>,
  Subscriber<unknown>,
  "return" | "next",
  number,
];

// // This is a pretty hokey priority queue that uses an array for storage
// // so enqueue is O(n). However, `n` is generally small. revisit.
// function createPriorityQueue() {
//   let thunks: Thunk[] = [];

//   return {
//     enqueue(thunk: Thunk): void {
//       let [priority] = thunk;
//       let index = thunks.findIndex(([p]) => p >= priority);
//       if (index === -1) {
//         thunks.push(thunk);
//       } else {
//         thunks.splice(index, 0, thunk);
//       }
//     },

//     dequeue(): Thunk | undefined {
//       return thunks.shift();
//     },
//   };
// }

function createPriorityQueue2() {
  let q = new PriorityQueue<Thunk>();

  return {
    enqueue(thunk: Thunk): void {
      let [priority] = thunk;
      q.push(priority, thunk);
    },
    dequeue(): Thunk | undefined {
      while (true) {
        let top = q.pop();
        if (!top) {
          return undefined;
        } else if (top[5] < top[1].version) {
          continue;
        } else {
          return top;
        }
      }
    },
  };
}

function qdir(cxt: string, q: PriorityQueue<Thunk>): void {
  console.log(cxt);
  console.dir(
    q.tiers.filter((t) => !!t).map((t) => ({
      priority: t.priority,
      items: t.items.map((i) => ({ c: i[1], r: i[2], t: i[4], v: i[5] })),
    })),
    { depth: 10 },
  );
}
