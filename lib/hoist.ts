import { Ok } from "./result.ts";
import { Effect, Operation } from "./types.ts";

export function hoist(operation: Operation<unknown>): Hoist {
  return {
    operation,
    description: "hoist an operation",
    enter(resolve, routine) {
      let hoist = new HoistingIterator(operation, routine.data.iterator);
      routine.data.iterator = hoist;
      resolve(Ok());
      return (resolve) => resolve(Ok());
    },
  };
}

interface Hoist extends Effect<unknown> {
  operation: Operation<unknown>;
}

function isHoist(effect: Effect<unknown>): effect is Hoist {
  return !!(effect as Hoist).operation;
}

type EffectIterator = ReturnType<Operation<unknown>[typeof Symbol.iterator]>;

class HoistingIterator implements EffectIterator {
  escape?: { value: unknown; stack: EffectIterator[] } = void (0);
  stack: EffectIterator[];
  current: EffectIterator;
  constructor(operation: Operation<unknown>, original: EffectIterator) {
    this.stack = [original];
    this.current = operation[Symbol.iterator]();
  }

  next(value: unknown) {
    let next = this.current.next(value);
    while (true) {
      if (next.done) {
        let top = this.stack.pop();
        if (!top) {
          top = this.escape?.stack.pop();
          if (!top) {
            return this.escape
              ? { done: true, value: this.escape.value } as const
              : next;
          } else {
            this.current = top;
            if (top.return) {
              next = top.return(this.escape!.value);
            } else {
              next = { done: true, value: this.escape!.value };
            }
          }
        } else {
          this.current = top;
          next = this.current.next(next.value);
        }
      } else {
        let effect = next.value;
        if (isHoist(effect)) {
          this.stack.push(this.current);
          this.current = effect.operation[Symbol.iterator]();
          next = this.current.next(value);
        } else {
          return next;
        }
      }
    }
  }

  return(value: unknown) {
    this.escape = { value, stack: this.stack.concat(this.current) };
    this.stack = [];
    this.current = { next: () => ({ done: true, value: void 0 }) };
    return this.next(value);
  }

  throw(error: unknown): IteratorResult<Effect<unknown>, unknown> {
    throw error;
  }
}
