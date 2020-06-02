import { beforeEach } from 'mocha';
import { main, resource, Context, Controls } from 'effection';
import { on, once } from '@effection/events';
import { Readable } from 'stream';

export let World: Context & Controls;

beforeEach(() => {
  World = main(undefined) as Context & Controls;
});

afterEach(() => {
  if(World.state === "errored") {
    console.error(World.result);
  }
  World.halt();
})

export class TestStream {
  public output = "";

  static *of(value: Readable) {
    let testStream = new TestStream(value);
    return yield resource(testStream, testStream.run());
  }

  constructor(private stream: Readable) {};

  *run() {
    let events = yield on(this.stream, "data");
    while(true) {
      let { value: chunk } = yield events.next();
      this.output += chunk;
    }
  }

  *waitFor(text: string) {
    while(!this.output.match(text)) {
      yield once(this.stream, "data");
      yield Promise.resolve();
    }
  }
}
