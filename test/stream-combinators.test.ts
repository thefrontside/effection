import {
  beforeEach,
  describe,
  expect,
  it,
} from "./suite.ts";

import type { Channel, Operation, Port, Stream } from "../mod.ts";
import { createChannel, run, map, filter } from "../mod.ts";

describe("Stream combinators", () => {
  let channel: Channel<string, string>;

  beforeEach(() => {
    channel = createChannel();
  });

  it("lets you map", () => run(function* () {
    let upCase = map(function* (item: string) {
      return item.toUpperCase();
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
    let longStrings = filter(function* (a: string) {
      return a.length > 3;
    });

    let subscription = yield* longStrings(channel.output);

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

  it('lets you map and filter in combination', async () => { });

});
