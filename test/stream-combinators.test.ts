import {
beforeEach,
  describe,
  expect,
it,
} from "./suite.ts";

import type { Channel, Operation, Port, Stream } from "../mod.ts";
import { createChannel, run, map } from "../mod.ts";

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
    expect(next.value).toBe('FOO')
  }));

  it('lets you filter', async () => {
    
  });

  it('lets you map and filter in combination', async () => {});

});