import { on, once, onceFP, onFP, pipe } from "../mod.ts";
import type { Operation, Stream } from "../mod.ts";
import { describe, expectType, it } from "./suite.ts";

describe("events", () => {
  describe("types", () => {
    const domElement = {} as HTMLElement;
    const socket = {} as WebSocket;

    describe("once", () => {
      it("should find event from eventTarget", () => {
        expectType<Operation<CloseEvent>>(pipe(socket, onceFP("close")));

        expectType<Operation<MouseEvent>>(once(domElement, "click"));
      });

      it("should fall back to event", () => {
        expectType<Operation<Event>>(
          pipe(domElement, onceFP("anothercustomevent")),
        );

        expectType<Operation<Event>>(once(domElement, "anothercustomevent"));
      });
    });

    describe("on", () => {
      it("should find event from eventTarget", () => {
        // deno-lint-ignore no-explicit-any
        expectType<Stream<MessageEvent<any>, never>>(
          pipe(socket, onFP("message")),
        );

        // deno-lint-ignore no-explicit-any
        expectType<Stream<MessageEvent<any>, never>>(on(socket, "message"));
      });

      it("should fall back to event", () => {
        expectType<Stream<Event, never>>(
          pipe(domElement, onFP("anothercustomevent")),
        );

        expectType<Stream<Event, never>>(on(domElement, "anothercustomevent"));
      });
    });
  });
});
