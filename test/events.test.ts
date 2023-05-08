import { on, once, run } from "../mod.ts";
import type { Operation, Stream } from "../mod.ts";
import { describe, expect, expectType, it } from "./suite.ts";
import { EventEmitter } from "node:events";

describe("events", () => {
  describe("eventEmitter", () => {
    it("on", () =>
      run(function* () {
        let eventEmitter = new EventEmitter();
        let subscription = yield* on(eventEmitter, "event");

        eventEmitter.emit("event", 1);

        let next = yield* subscription.next();

        expect(next).toEqual({ done: false, value: 1 });
      }));

    it("once", () =>
      run(function* () {
        let eventEmitter = new EventEmitter();
        let subscription = yield* on(eventEmitter, "event");

        eventEmitter.emit("event", 1);

        let next = yield* subscription.next();

        expect(next).toEqual({ done: false, value: 1 });
      }));
  });

  describe("types", () => {
    const domElement = {} as HTMLElement;
    const socket = {} as WebSocket;

    it("should find event from eventTarget", () => {
      expectType<Operation<CloseEvent>>(once(socket, "close"));
      expectType<Operation<MouseEvent>>(once(domElement, "click"));

      // deno-lint-ignore no-explicit-any
      expectType<Stream<MessageEvent<any>, never>>(on(socket, "message"));
    });

    it("should fall back to event", () => {
      expectType<Operation<Event>>(once(domElement, "mycustomevent"));

      expectType<Stream<Event, never>>(on(domElement, "anothercustomevent"));
    });

    it("should type eventEmitter", () => {
      let eventEmitter = new EventEmitter();
      expectType<Stream<Event, never>>(on(eventEmitter, "event"));
    });
  });
});
