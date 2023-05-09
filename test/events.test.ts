import { on, once, pipe } from "../mod.ts";
import type { Operation, Stream } from "../mod.ts";
import { describe, expectType, it } from "./suite.ts";

describe("events", () => {
  describe("types", () => {
    const domElement = {} as HTMLElement;
    const socket = {} as WebSocket;

    describe("once", () => {
      it("should find event from eventTarget", () => {
        expectType<Operation<CloseEvent>>(pipe(socket, once("close")));

        expectType<Operation<MouseEvent>>(once("click", domElement));
      });

      it("should fall back to event", () => {
        expectType<Operation<Event>>(
          pipe(domElement, once("anothercustomevent")),
        );

        expectType<Operation<Event>>(once("anothercustomevent", domElement));
      });
    });

    describe("on", () => {
      it("should find event from eventTarget", () => {
        // deno-lint-ignore no-explicit-any
        expectType<Stream<MessageEvent<any>, never>>(
          pipe(socket, on("message")),
        );

        // deno-lint-ignore no-explicit-any
        expectType<Stream<MessageEvent<any>, never>>(on("message", socket));
      });

      it("should fall back to event", () => {
        expectType<Stream<Event, never>>(
          pipe(domElement, on("anothercustomevent")),
        );

        expectType<Stream<Event, never>>(on("anothercustomevent", domElement));
      });
    });
  });
});
