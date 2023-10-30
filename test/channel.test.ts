import {
  afterEach as $afterEach,
  beforeEach as $beforeEach,
  describe,
  expect,
  it as $it,
} from "./suite.ts";

import type { Operation, Port, Subscription } from "../mod.ts";
import { createChannel, createScope, sleep, spawn } from "../mod.ts";

let [scope, close] = createScope();

describe("Channel", () => {
  $beforeEach(() => {
    [scope, close] = createScope();
  });
  $afterEach(() => close());

  it("does not use the same event twice when serially subscribed to a channel", function* () {
    let { input, subscribe } = createChannel<string, void>();
    let actual: string[] = [];
    function* channel() {
      yield* sleep(10);
      yield* input.send("one");
      yield* input.send("two");
    }

    function* root() {
      yield* spawn(channel);

      let subscription = yield* subscribe();
      let result = yield* subscription.next();
      actual.push(result.value as string);

      subscription = yield* subscribe();
      result = yield* subscription.next();
      actual.push(result.value as string);
    }

    yield* root();
    expect(actual).toEqual(["one", "two"]);
  });

  describe("subscribe", () => {
    let input: Port<string, void>;
    let subscribe: () => Operation<Subscription<string, void>>;

    beforeEach(function* () {
      ({ input, subscribe } = createChannel<string, void>());
    });

    describe("sending a message", () => {
      it("receives message on subscription", function* () {
        let subscription = yield* subscribe();
        yield* input.send("hello");
        let result = yield* subscription.next();
        expect(result.done).toEqual(false);
        expect(result.value).toEqual("hello");
      });
    });

    describe("blocking on next", () => {
      it("receives message on subscription done", function* () {
        let subscription = yield* subscribe();
        let result = yield* spawn(() => subscription.next());
        yield* sleep(10);
        yield* input.send("hello");
        expect(yield* result).toHaveProperty("value", "hello");
      });
    });

    describe("sending multiple messages", () => {
      it("receives messages in order", function* () {
        let subscription = yield* subscribe();
        let { send } = input;
        yield* send("hello");
        yield* send("foo");
        yield* send("bar");
        expect(yield* subscription.next()).toHaveProperty("value", "hello");
        expect(yield* subscription.next()).toHaveProperty("value", "foo");
        expect(yield* subscription.next()).toHaveProperty("value", "bar");
      });
    });

    describe("with split ends", () => {
      it("receives message on subscribable end", function* () {
        let { input, subscribe } = createChannel();

        let subscription = yield* subscribe();

        yield* input.send("hello");

        expect(yield* subscription.next()).toEqual({
          done: false,
          value: "hello",
        });
      });
    });

    describe("close", () => {
      describe("without argument", () => {
        it("closes subscriptions", function* () {
          let { input, subscribe } = createChannel();
          let subscription = yield* subscribe();
          yield* input.send("foo");
          yield* input.close();
          expect(yield* subscription.next()).toEqual({
            done: false,
            value: "foo",
          });
          expect(yield* subscription.next()).toEqual({
            done: true,
            value: undefined,
          });
        });
      });

      describe("with close argument", () => {
        it("closes subscriptions with the argument", function* () {
          let { input, subscribe } = createChannel<string, number>();
          let subscription = yield* subscribe();
          yield* input.send("foo");
          yield* input.close(12);

          expect(yield* subscription.next()).toEqual({
            done: false,
            value: "foo",
          });
          expect(yield* subscription.next()).toEqual({ done: true, value: 12 });
        });
      });
    });
  });
});

function beforeEach(op: () => Operation<void>): void {
  $beforeEach(() => scope.run(op));
}

function it(desc: string, op: () => Operation<void>): void {
  $it(desc, () => scope.run(op));
}
