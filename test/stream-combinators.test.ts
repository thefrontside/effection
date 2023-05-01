import {
  beforeEach,
  describe,
  expect,
  it,
} from "./suite.ts";

import type { Channel } from "../mod.ts";
import { createChannel, run, map, filter, pipe } from "../mod.ts";

describe("Stream combinators", () => {
  let channel: Channel<string, string>;

  beforeEach(() => {
    channel = createChannel();
  });

  it("lets you map", () => run(function* () {
    let upCase = map({
      op: function*(item: string) {
        return item.toUpperCase();
      }
    });

    let subscription = yield* upCase(channel.output);

    yield* channel.input.send('foo');

    let next = yield* subscription.next();

    expect(next.done).toBe(false);
    expect(next.value).toBe('FOO');

    yield* channel.input.close('var');

    expect(yield* subscription.next()).toEqual({
      done: true,
      value: 'var'
    });
  }));

  it('lets you filter', () => run(function* () {
    let longs = filter(function* (a: string) {
      return a.length > 3;
    });

    let subscription = yield* longs(channel.output);

    yield* channel.input.send('no');
    yield* channel.input.send('way');
    yield* channel.input.send('good');

    let next = yield* subscription.next();

    expect(next.done).toBe(false);
    expect(next.value).toBe('good');

    yield* channel.input.close('var');

    expect(yield* subscription.next()).toEqual({
      done: true,
      value: 'var'
    });
  }));

  it('lets you map and filter in combination', () => run(function* () {
    let upCase = map({
      op: function*(item: string) {
        return item.toUpperCase();
      }
    });

    let shorts = filter(function* (a: string) {
      return a.length < 4;
    });

    let subscription = yield* pipe(channel.output, shorts, upCase);

    yield* channel.input.send('too long');
    yield* channel.input.send('too long 2');
    yield* channel.input.send('too long 3');
    yield* channel.input.send('foo');

    let next = yield* subscription.next();

    expect(next.done).toBe(false);
    expect(next.value).toBe('FOO');

    yield* channel.input.close('var');

    expect(yield* subscription.next()).toEqual({
      done: true,
      value: 'var'
    });
  }));

  it('lets you pass an ordinary function for a predicate', () => run(function* () {
    let upCase = map({
      op: function(item: string) {
        return item.toUpperCase();
      }
    });

    let shorts = filter(function(a: string) {
      return a.length < 4;
    });

    let subscription = yield* pipe(channel.output, shorts, upCase);

    yield* channel.input.send('too long');
    yield* channel.input.send('too long 2');
    yield* channel.input.send('too long 3');
    yield* channel.input.send('foo');

    let next = yield* subscription.next();

    expect(next.done).toBe(false);
    expect(next.value).toBe('FOO');

    yield* channel.input.close('var');

    expect(yield* subscription.next()).toEqual({
      done: true,
      value: 'var'
    });
  }));
});
