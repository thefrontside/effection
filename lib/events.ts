// deno-lint-ignore-file no-explicit-any ban-types
import { createChannel } from "./channel.ts";
import { assert } from "./deps.ts";
import { resource } from "./instructions.ts";
import { first } from "./mod.ts";
import { useScope } from "./run/scope.ts";
import type { Operation, Stream } from "./types.ts";

type FN = (...any: any[]) => any;

type EventTypeFromEventTarget<T, K extends string> = `on${K}` extends keyof T
  ? Parameters<Extract<T[`on${K}`], FN>>[0]
  : Event;

export type EventList<T> = T extends {
  addEventListener(type: infer P, ...args: any): void;
  // we basically ignore this but we need it so we always get the first override of addEventListener
  addEventListener(type: infer P2, ...args: any): void;
} ? P & string
  : never;

export function once<
  T extends EventTarget,
  K extends EventList<T> | (string & {}),
>(name: K): (target: T) => Operation<EventTypeFromEventTarget<T, K>>;
export function once<
  T extends EventTarget,
  K extends EventList<T> | (string & {}),
>(name: K, target: T): Operation<EventTypeFromEventTarget<T, K>>;
export function once<
  T extends EventTarget,
  K extends EventList<T> | (string & {}),
>(this: unknown, name: K, target?: T): unknown {
  const fn = once<T, K>;

  if (arguments.length < 2) {
    return fn.bind(this, name);
  }

  assert(target, `once target undefined`);

  return first(on(name, target));
}

export function on<
  T extends EventTarget,
  K extends EventList<T> | (string & {}),
>(name: K): (target: T) => Stream<EventTypeFromEventTarget<T, K>, never>;
export function on<
  T extends EventTarget,
  K extends EventList<T> | (string & {}),
>(name: K, target: T): Stream<EventTypeFromEventTarget<T, K>, never>;
export function on<
  T extends EventTarget,
  K extends EventList<T> | (string & {}),
>(this: unknown, name: K, target?: T): unknown {
  const fn = on<T, K>;

  if (arguments.length < 2) {
    return fn.bind(this, name);
  }

  assert(target, `on target undefined`);

  return resource(function* (provide) {
    let { input, output } = createChannel<Event, never>();
    let scope = yield* useScope();
    let listener = (event: Event) => scope.run(() => input.send(event));

    target.addEventListener(name, listener);

    try {
      yield* provide(
        yield* output as Stream<EventTypeFromEventTarget<T, K>, never>,
      );
    } finally {
      target.removeEventListener(name, listener);
    }
  });
}
