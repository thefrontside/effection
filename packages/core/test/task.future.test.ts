import './setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { run, sleep, createFuture } from '../src/index';

describe('task with future', () => {
  it('resolves when resolve is called', async () => {
    let { future, resolve } = createFuture<number>();
    let task = run(future);

    await run(sleep(5));
    resolve({ state: 'completed', value: 123 });

    await expect(task).resolves.toEqual(123);
    expect(task.state).toEqual('completed');
  });

  it('can resolve synchronously', async () => {
    let { future, resolve } = createFuture<number>();
    resolve({ state: 'completed', value: 123 });

    let task = run(future);
    expect(task.state).toEqual('completed');
  });

  it('can resolve task synchronously', async () => {
    let { future, resolve } = createFuture<number>();
    resolve({ state: 'completed', value: 123 });

    let task = run(future);
    let other = run(task);
    expect(other.state).toEqual('completed');
  });

  it('rejects when reject is called', async () => {
    let { future, resolve } = createFuture<number>();
    let task = run(future);

    await run(sleep(5));
    resolve({ state: 'errored', error: new Error('boom') });

    await expect(task).rejects.toHaveProperty('message', 'boom');
    expect(task.state).toEqual('errored');
  });

  it('can be halted', async () => {
    let { future } = createFuture<number>();
    let task = run(future);

    await task.halt();

    await expect(task).rejects.toHaveProperty('message', 'halted')
    expect(task.state).toEqual('halted');
  });
});
