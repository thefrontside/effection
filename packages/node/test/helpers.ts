import { beforeEach } from 'mocha';
import { run, Task } from 'effection';
import { on, once } from '@effection/events';
import { Readable } from 'stream';

export let World: Task;

beforeEach(() => {
  World = run();
});

afterEach(async () => {
  await World.halt();
})

export class TestStream {
  public output = "";

  constructor(private task: Task, private stream: Readable) {};

  *run(task: Task) {
    let events = on(task, this.stream, "data");
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
