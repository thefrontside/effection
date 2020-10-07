import { performance } from 'perf_hooks';
import { beforeEach } from 'mocha';
import * as expect from 'expect';
import { main, Context, Controls } from 'effection';
import { Channel } from '@effection/channel';
import { subscribe } from '@effection/subscription';

import { exec, Process } from '../src/exec';

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

export class TestProcess {
  private isWin32 = false;
  stdout: TestStream;
  stderr: TestStream;

  static async exec(cmd: string) {
    return new TestProcess(await World.spawn(exec(cmd)));
  }

  constructor(public process: Process) {
    this.stdout = TestStream.of(process.stdout);
    this.stderr = TestStream.of(process.stderr);
  }

  async join() {
    return await World.spawn(this.process.join());
  }

  // cross platform graceful shutdown request. What would
  // be sent to the process by the Operating system when
  // a users requests a terminate.
  terminate() {
    if (this.isWin32) {
      //TODO:
    } else {
      process.kill(this.process.pid, 'SIGTERM');
    }
  }

  // cross platform user initiated graceful shutdown request. What would
  // be sent to the process by the Operating system when
  // a users requests an interrupt via CTRL-C or equivalent.
  interrupt() {
    if (this.isWin32) {
      //TODO:
    } else {
      process.kill(this.process.pid, 'SIGINT');
    }
  }
}

export class TestStream {
  public output = "";

  static of(channel: Channel<string>) {
    let testStream = new TestStream();
    World.spawn(function*() {
      yield subscribe(channel).forEach(function*(chunk) {
        testStream.output += chunk.toString();
      });
    });
    return testStream;
  }

  constructor() {};

  async detect(text: string) {
    return converge(() => expect(this.output).toContain(text));
  }
}

export async function converge<T>(fn: () => T): Promise<T> {
  let startTime = performance.now();
  while(true) {
    try {
      return fn();
    } catch(e) {
      let diff = performance.now() - startTime;
      if(diff > 2000) {
        throw e;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }
  }
}
