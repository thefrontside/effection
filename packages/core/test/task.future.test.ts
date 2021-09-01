import './setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { run, sleep, createFuture } from '../src/index';

describe('task with future', () => {
  it('resolves when resolve is called', async () => {
    let { future, produce } = createFuture<number>();
    let task = run(future);

    await run(sleep(5));
    produce({ state: 'completed', value: 123 });

    await expect(task).resolves.toEqual(123);
    expect(task.state).toEqual('completed');
  });

  it('can resolve synchronously', async () => {
    let { future, produce } = createFuture<number>();
    produce({ state: 'completed', value: 123 });

    let task = run(future);
    expect(task.state).toEqual('completed');
  });

  it('can resolve task synchronously', async () => {
    let { future, produce } = createFuture<number>();
    produce({ state: 'completed', value: 123 });

    let task = run(future);
    let other = run(task);
    expect(other.state).toEqual('completed');
  });

  it('rejects when reject is called', async () => {
    let { future, produce } = createFuture<number>();
    let task = run(future);

    await run(sleep(5));
    produce({ state: 'errored', error: new Error('boom') });

    await expect(task).rejects.toHaveProperty('message', 'boom');
    expect(task.state).toEqual('errored');
  });

  it('can be halted', async () => {
    let { future } = createFuture<number>();
    let task = run(future);

    await task.halt();

    await expect(task).rejects.toHaveProperty('message', 'halted');
    expect(task.state).toEqual('halted');
  });

  it('can be synchronously continued even when already failed', async () => {
    await expect(run((task) => {
      task.run(function* florb() {
        throw new Error('moo');
      });

      let { future, produce } = createFuture<undefined>();
      produce({ state: 'completed', value: undefined });
      return future;
    })).rejects.toHaveProperty('message', 'moo');
  });
});
