import { createNumber, blowUp } from './setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { run, sleep, Task } from '../src/index';
import { Deferred } from '../src/deferred';

describe('generator function', () => {
  it('can compose multiple promises via generator', async () => {
    let task = run(function*() {
      let one: number = yield Promise.resolve(12);
      let two: number = yield Promise.resolve(55);
      return one + two;
    });
    await expect(task).resolves.toEqual(67);
    expect(task.state).toEqual('completed');
    expect(task.result).toEqual(67);
  });

  it('can compose operations', async () => {
    let task = run(function*() {
      let one: number = yield createNumber(12);
      let two: number = yield createNumber(55);
      return one + two;
    });
    await expect(task).resolves.toEqual(67);
    expect(task.state).toEqual('completed');
    expect(task.result).toEqual(67);
  });

  it('rejects generator if subtask promise fails', async () => {
    let error = new Error('boom');
    let task = run(function*() {
      let one: number = yield createNumber(12);
      let two: number = yield blowUp;
      return one + two;
    });
    await expect(task).rejects.toEqual(error);
    expect(task.state).toEqual('errored');
    expect(task.error).toEqual(error);
  });

  it('rejects generator if generator creation fails', async () => {
    let task = run(function() {
      throw new Error('boom');
    });
    await expect(task).rejects.toHaveProperty('message', 'boom');
    expect(task.state).toEqual('errored');
    expect(task.error).toHaveProperty('message', 'boom');
  });

  it('rejects generator if subtask operation fails', async () => {
    let task = run(function*() {
      let one: number = yield createNumber(12);
      let two: number = yield blowUp;
      return one + two;
    });
    await expect(task).rejects.toHaveProperty('message', 'boom');
    expect(task.state).toEqual('errored');
    expect(task.error).toHaveProperty('message', 'boom');
  });

  it('can recover from errors in promise', async () => {
    let error = new Error('boom');
    let task = run(function*() {
      let one: number = yield Promise.resolve(12);
      let two: number;
      try {
        yield Promise.reject(error);
        two = 9;
      } catch(e) {
        // swallow error and yield in catch block
        two = yield Promise.resolve(8);
      }
      let three: number = yield Promise.resolve(55);
      return one + two + three;
    });
    await expect(task).resolves.toEqual(75);
    expect(task.state).toEqual('completed');
    expect(task.result).toEqual(75);
  });

  it('can recover from errors in operation', async () => {
    let task = run(function*() {
      let one: number = yield Promise.resolve(12);
      let two: number;
      try {
        yield blowUp;
        two = 9;
      } catch(e) {
        // swallow error and yield in catch block
        two = yield Promise.resolve(8);
      }
      let three: number = yield Promise.resolve(55);
      return one + two + three;
    });
    await expect(task).resolves.toEqual(75);
    expect(task.state).toEqual('completed');
    expect(task.result).toEqual(75);
  });

  it('can halt generator', async () => {
    let task = run(function*() {
      let one: number = yield Promise.resolve(12);
      let two: number = yield;
      return one + two;
    });

    task.halt();

    await expect(task).rejects.toHaveProperty('message', 'halted')
    expect(task.state).toEqual('halted');
    expect(task.result).toEqual(undefined);
  });

  it('halts task when halted generator', async () => {
    let child: Task | undefined;
    let task = run(function*() {
      yield function*(task) {
        child = task;
        yield sleep(100);
      }
    });

    task.halt();

    await expect(task).rejects.toHaveProperty('message', 'halted')
    await expect(child).rejects.toHaveProperty('message', 'halted')
    expect(task.state).toEqual('halted');
    expect(task.result).toEqual(undefined);
    expect(child && child.state).toEqual('halted');
    expect(child && child.result).toEqual(undefined);
  });

  it('can suspend in finally block', async () => {
    let eventually = Deferred();

    let task = run(function*() {
      try {
        yield;
      } finally {
        yield sleep(10);
        eventually.resolve(123);
      }
    });

    task.halt();

    await expect(eventually.promise).resolves.toEqual(123);
    expect(task.state).toEqual('halted');
  });

  it('can await halt', async () => {
    let didRun = false;

    let task = run(function*() {
      try {
        yield;
      } finally {
        yield Promise.resolve(1);
        didRun = true;
      }
    });

    await task.halt();

    expect(didRun).toEqual(true);
    expect(task.state).toEqual('halted');
  });
});
