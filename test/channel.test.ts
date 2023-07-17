import {
  afterEach as $afterEach,
  beforeEach as $beforeEach,
  describe,
  expect,
  it as $it,
} from "./suite.ts";

import {
  createContext,
  Operation,
  Port,
  Stream,
  Subscription,
} from "../mod.ts";
import { createChannel, createScope, sleep, spawn } from "../mod.ts";

interface IterationContext<T> {
  subscription: Subscription<T, unknown>;
  current: IteratorResult<T>;
}

const IterContext = createContext<IterationContext<unknown>[]>("iter-ctx");

function* each<T>(stream: Stream<T, unknown>): Operation<Iterable<T>> {
  let subscription = yield* stream;
  let current = yield* subscription.next();
  let stack = yield* IterContext.get();
  if (!stack) {
    stack = yield* IterContext.set([]);
  }
  let context = { subscription, current };
  stack.push(context);

  let iterator = { next: () => context.current };

  return {
    [Symbol.iterator]: () => iterator,
  };
}
function* next(): Operation<void> {
  let stack = yield* IterContext;
  let context = stack[stack.length - 1];
  if (!context) {
    throw new Error(`cannot call next() outside of an iteration`);
  }
  let current = yield* context.subscription.next();
  context.current = current;
  if (current.done) {
    stack.pop();
  }
}

let scope = createScope();
describe("Channel", () => {
  $beforeEach(() => {
    scope = createScope();
  });
  $afterEach(() => scope.close());

  it("each()", function* () {
    const actual: string[] = [];
    let { input, output } = createChannel<string, void>();
    function* chan() {
      yield* sleep(10);
      yield* input.send("one");
      yield* input.send("two");
      yield* sleep(10);
      yield* input.close();
    }

    function* root() {
      yield* spawn(chan);
      const emitter = yield* each(output);
      for (let event of emitter) {
        console.log(event);
        actual.push(event);
        yield* next();
      }
    }
    yield* root();
    expect(actual).toEqual(["one", "two"]);
  });

  it("does not use the same event twice when serially subscribed to a channel", function* () {
    let { input, output } = createChannel<string, void>();
    let actual: string[] = [];
    function* channel() {
      yield* sleep(10);
      yield* input.send("one");
      yield* input.send("two");
    }

    function* root() {
      yield* spawn(channel);

      let subscription = yield* output;
      let result = yield* subscription.next();
      actual.push(result.value as string);

      subscription = yield* output;
      result = yield* subscription.next();
      actual.push(result.value as string);
    }

    yield* root();
    expect(actual).toEqual(["one", "two"]);
  });

  describe("subscribe", () => {
    let input: Port<string, void>;
    let output: Stream<string, void>;

    beforeEach(function* () {
      ({ input, output } = createChannel<string, void>());
    });

    describe("sending a message", () => {
      it("receives message on subscription", function* () {
        let subscription = yield* output;
        yield* input.send("hello");
        let result = yield* subscription.next();
        expect(result.done).toEqual(false);
        expect(result.value).toEqual("hello");
      });
    });

    describe("blocking on next", () => {
      it("receives message on subscription done", function* () {
        let subscription = yield* output;
        let result = yield* spawn(() => subscription.next());
        yield* sleep(10);
        yield* input.send("hello");
        expect(yield* result).toHaveProperty("value", "hello");
      });
    });

    describe("sending multiple messages", () => {
      it("receives messages in order", function* () {
        let subscription = yield* output;
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
        let { input, output } = createChannel();

        let subscription = yield* output;

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
          let { input, output } = createChannel();
          let subscription = yield* output;
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
          let { input, output } = createChannel<string, number>();
          let subscription = yield* output;
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
