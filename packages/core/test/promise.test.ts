import './setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { run } from '../src/index';

describe('promise', () => {
  it('runs a promise to completion', async () => {
    let task = run(Promise.resolve(123))
    await expect(task).resolves.toEqual(123);
    expect(task.state).toEqual('completed');
  });

  it('rejects a failed promise', async () => {
    let error = new Error('boom');
    let task = run(Promise.reject(error))
    await expect(task).rejects.toEqual(error);
    expect(task.state).toEqual('errored');
  });

  it('can halt a promise', async () => {
    let promise = new Promise(() => { /* never resolves */ });
    let task = run(promise);

    task.halt();

    await expect(task).rejects.toHaveProperty('message', 'halted')
    expect(task.state).toEqual('halted');
  });

  it('can halt a pending promise which will resolve in the next event loop tick', async () => {
    let promise = Promise.resolve("foo");
    let task = run(promise);

    task.halt();

    await expect(task).rejects.toHaveProperty('message', 'halted')
    expect(task.state).toEqual('halted');
  });

  it('can halt a pending promise which will reject in the next event loop tick', async () => {
    let promise = Promise.reject(new Error('moo'));
    let task = run(promise);

    task.halt();

    await expect(task).rejects.toHaveProperty('message', 'halted')
    expect(task.state).toEqual('halted');
  });

  describe('function', () => {
    it('runs a promise to completion', async () => {
      let task = run(() => Promise.resolve(123))
      await expect(task).resolves.toEqual(123);
      expect(task.state).toEqual('completed');
    });

    it('rejects a failed promise', async () => {
      let error = new Error('boom');
      let task = run(() => Promise.reject(error))
      await expect(task).rejects.toEqual(error);
      expect(task.state).toEqual('errored');
    });

    it('can halt a promise', async () => {
      let promise = new Promise(() => { /* never resolves */ });
      let task = run(() => promise);

      task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted')
      expect(task.state).toEqual('halted');
    });
  });
});
