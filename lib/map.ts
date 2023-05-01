import { OperationFunction } from "./lift.ts";
import { isOperation, lift } from "./mod.ts";
import type { Stream } from "./types.ts";

export function map<A, B>({ op }: { op: ((a: A) => B) | OperationFunction<[A], B>; }) {
  let lifted = (isOperation(op) ? op : lift(op));
  
  return function <TClose>(stream: Stream<A, TClose>): Stream<B, TClose> {
    return {
      *[Symbol.iterator]() {
        let subscription = yield* stream;

        return {
          * next() {
            let next = yield* subscription.next();

            if(next.done) {
              return next;
            } else {
              return { ...next, value: yield* lifted(next.value) }
            }
          }
        }
      } 
    }
  }
}