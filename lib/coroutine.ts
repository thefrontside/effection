import { Generation } from "./contexts.ts";
import { ReducerContext } from "./reducer.ts";
import { Ok } from "./result.ts";
import { Coroutine, Operation, Scope, Subscriber } from "./types.ts";

export interface CoroutineOptions<T> {
  scope: Scope;
  operation(): Operation<T>;
}

export function createCoroutine<T>(
  { operation, scope }: CoroutineOptions<T>,
): Coroutine<T> {
  let subscribers = new Set<Subscriber<T>>();

  let send: Subscriber<T> = (item) => {
    try {
      for (let subscriber of subscribers) {
        subscriber(item);
      }
    } finally {
      if (item.done) {
        subscribers.clear();
      }
    }
  };

  let reducer = scope.expect(ReducerContext);

  let iterator: Coroutine<T>["data"]["iterator"] | undefined = undefined;

  let routine = {
    scope,
    data: {
      get iterator() {
        if (!iterator) {
          iterator = operation()[Symbol.iterator]();
        }
        return iterator;
      },
      discard: (resolve) => resolve(Ok()),
    },
    next(result, subscriber) {
      if (subscriber) {
        subscribers.add(subscriber);
      }
      routine.data.discard((exit) => {
        routine.data.discard = (resolve) => resolve(Ok());
        reducer.reduce([
          scope.expect(Generation),
          routine,
          exit.ok ? result : exit,
          send as Subscriber<unknown>,
          "next",
        ]);
      });

      return () => subscriber && subscribers.delete(subscriber);
    },
    return(result, subscriber?: Subscriber<void>) {
      if (subscriber) {
        subscribers.add(subscriber as Subscriber<T>);
      }
      routine.data.discard((exit) => {
        routine.data.discard = (resolve) => resolve(Ok());
        reducer.reduce([
          scope.expect(Generation),
          routine,
          exit.ok ? result : exit,
          send as Subscriber<unknown>,
          "return",
        ]);
      });

      return () =>
        subscriber && subscribers.delete(subscriber as Subscriber<T>);
    },
  } as Coroutine<T>;

  return routine;
}

export function* useCoroutine(): Operation<Coroutine> {
  return (yield {
    description: "useCoroutine()",
    enter: (resolve, routine) => {
      resolve(Ok(routine));
      return (uninstalled) => uninstalled(Ok());
    },
  }) as Coroutine;
}
