import { Ok } from "effection";
import type { Coroutine, Effect, Operation, Result } from "effection";

/**
 * Still present at runtime but intentionally omitted from Effection's public
 * `Coroutine` because it's considered a private API.
 */
type RoutineData = Coroutine["data"] & {
  iterator: EffectIterator;
};

export function inline<T>(operation: Operation<T>): Inline<T> {
  return {
    operation,
    description: `inline(${operation})`,
    enter(resolve, routine) {
      let data = routine.data as RoutineData;
      let current = data.iterator;
      if (isInlineIterator(current)) {
        current.stack.push(current.current);
        current.current = operation[Symbol.iterator]();
      } else {
        // Don't turn this back into a `defineProperty`. `step()` reads the
        // iterator from a closure variable that only this setter writes, so a
        // getter type checks, runs, and silently does nothing.
        data.iterator = new InlineIterator(operation, current);
      }
      resolve(Ok() as Result<T>);
      return (didExit) => didExit(Ok());
    },
  };
}

interface Inline<T> extends Effect<T> {
  operation: Operation<T>;
}

function isInline<T>(effect: Effect<T>): effect is Inline<T> {
  return "operation" in effect;
}

type EffectIterator = Iterator<Effect<unknown>, unknown, unknown>;

function isInlineIterator(
  iterator: EffectIterator,
): iterator is InlineIterator {
  return "@effectionx/inline" in iterator;
}

class InlineIterator implements EffectIterator {
  "@effectionx/inline" = true;
  stack: EffectIterator[];
  current: EffectIterator;

  constructor(operation: Operation<unknown>, original: EffectIterator) {
    this.stack = [original];
    this.current = operation[Symbol.iterator]();
  }

  next(value: unknown): IteratorResult<Effect<unknown>, unknown> {
    let next: IteratorResult<Effect<unknown>, unknown>;
    try {
      next = this.current.next(value);
    } catch (error) {
      return this.raise(error);
    }
    return this.step(next);
  }

  return(value: unknown): IteratorResult<Effect<unknown>, unknown> {
    if (this.current.return) {
      let result: IteratorResult<Effect<unknown>, unknown>;
      try {
        result = this.current.return(value);
      } catch (error) {
        return this.raise(error);
      }
      if (!result.done) {
        return result;
      }
      value = result.value;
    }

    while (this.stack.length > 0) {
      let top = this.stack.pop()!;
      this.current = top;
      if (top.return) {
        let result: IteratorResult<Effect<unknown>, unknown>;
        try {
          result = top.return(value);
        } catch (error) {
          return this.raise(error);
        }
        if (!result.done) {
          return result;
        }
        value = result.value;
      }
    }

    return { done: true, value };
  }

  throw(error: unknown): IteratorResult<Effect<unknown>, unknown> {
    return this.raise(error);
  }

  step(
    next: IteratorResult<Effect<unknown>, unknown>,
  ): IteratorResult<Effect<unknown>, unknown> {
    while (true) {
      if (next.done) {
        let top = this.stack.pop();
        if (!top) {
          return next;
        }
        this.current = top;
        try {
          next = this.current.next(next.value);
        } catch (error) {
          return this.raise(error);
        }
      } else {
        let effect = next.value;
        if (isInline(effect)) {
          this.stack.push(this.current);
          this.current = effect.operation[Symbol.iterator]();
          try {
            next = this.current.next(undefined);
          } catch (error) {
            return this.raise(error);
          }
        } else {
          return next;
        }
      }
    }
  }

  raise(error: unknown): IteratorResult<Effect<unknown>, unknown> {
    if (this.current.throw) {
      let next: IteratorResult<Effect<unknown>, unknown>;
      try {
        next = this.current.throw(error);
      } catch (rethrown) {
        return this.propagate(rethrown);
      }
      return this.step(next);
    }

    return this.propagate(error);
  }

  propagate(error: unknown): IteratorResult<Effect<unknown>, unknown> {
    let top = this.stack.pop();
    if (!top) {
      throw error;
    }
    this.current = top;
    return this.raise(error);
  }
}
