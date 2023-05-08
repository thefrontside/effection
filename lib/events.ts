// deno-lint-ignore-file no-explicit-any ban-types
import { createChannel } from "./channel.ts";
import { resource } from "./instructions.ts";
import { first } from "./mod.ts";
import { useScope } from "./run/scope.ts";
import type { Operation, Stream } from "./types.ts";
import { EventEmitter } from "node:events";

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
  T extends EventTarget | EventEmitter,
  K extends EventList<T> | (string & {}),
>(target: T, name: K): Operation<EventTypeFromEventTarget<T, K>> {
  return resource(function* (provide) {
    let { input, output } = createChannel<Event, never>();
    let scope = yield* useScope();

    let listener = (event: Event) => scope.run(() => input.send(event));

    if ("addEventListener" in target) {
      target.addEventListener(name, listener);
    } else if ("addListener" in target) {
      target.addListener(name, listener);
    }

    try {
      yield* provide(
        yield* first(output as Stream<EventTypeFromEventTarget<T, K>, never>),
      );
    } finally {
      if ("removeEventListener" in target) {
        target.removeEventListener(name, listener);
      } else {
        target.removeListener(name, listener);
      }
    }
  });
}

export function on<
  T extends EventTarget | EventEmitter,
  K extends EventList<T> | (string & {}),
>(target: T, name: K): Stream<EventTypeFromEventTarget<T, K>, never> {
  return resource(function* (provide) {
    let { input, output } = createChannel<Event, never>();
    let scope = yield* useScope();
    let listener = (event: Event) => scope.run(() => input.send(event));

    if ("addEventListener" in target) {
      target.addEventListener(name, listener);
    } else if ("addListener" in target) {
      target.addListener(name, listener);
    }

    try {
      yield* provide(
        yield* output as Stream<EventTypeFromEventTarget<T, K>, never>,
      );
    } finally {
      if ("removeEventListener" in target) {
        target.removeEventListener(name, listener);
      } else {
        target.removeListener(name, listener);
      }
    }
  });
}
