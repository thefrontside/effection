import { describe, beforeEach, it } from 'mocha';
import * as expect from 'expect';

import { run, Task } from '../src/index';

process.on('unhandledRejection', (reason, promise) => {
  // silence warnings in tests
});

describe('spawn', () => {
  it('can spawn a new child task', async () => {
    let root = run(function*(context: Task<unknown>) {
      let child = context.spawn(function*() {
        let one: number = yield Promise.resolve(12);
        let two: number = yield Promise.resolve(55);

        return one + two;
      });

      return yield child;
    });
    await expect(root).resolves.toEqual(67);
  });

  it('halts child when halted', async () => {
    let child;
    let root = run(function*(context: Task<unknown>) {
      child = context.spawn(function*() {
        yield;
      });

      yield;
    });

    await root.halt();

    await expect(child).rejects.toHaveProperty('message', 'halted')
  });

  it('halts child when finishing normally', async () => {
    let child;
    let root = run(function*(context: Task<unknown>) {
      child = context.spawn(function*() {
        yield;
      });

      return 1;
    });

    await expect(root).resolves.toEqual(1);
    await expect(child).rejects.toHaveProperty('message', 'halted')
  });

  it('halts child when errored', async () => {
    let child;
    let root = run(function*(context: Task<unknown>) {
      child = context.spawn(function*() {
        yield;
      });

      throw new Error('boom');
    });

    await expect(root).rejects.toHaveProperty('message', 'boom');
    await expect(child).rejects.toHaveProperty('message', 'halted');
  });
});
