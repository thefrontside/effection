import { on, once } from "../mod.ts";
import type { Operation, Stream } from "../mod.ts";
import { describe, expectType, it } from "./suite.ts";

describe("events", () => {
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
  });
});
