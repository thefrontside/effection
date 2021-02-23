import './setup';
import { describe, beforeEach, it } from 'mocha';
import * as expect from 'expect';

import { run } from '../src/index';

describe('promise', () => {
  it('runs a promise to completion', async () => {
    let task = run(Promise.resolve(123))
    await expect(task).resolves.toEqual(123);
    expect(task.state).toEqual('completed');
    expect(task.result).toEqual(123);
  });

  it('rejects a failed promise', async () => {
    let error = new Error('boom');
    let task = run(Promise.reject(error))
    await expect(task).rejects.toEqual(error);
    expect(task.state).toEqual('errored');
    expect(task.error).toEqual(error);
  });

  it('can halt a promise', async () => {
    let promise = new Promise(() => {});
    let task = run(promise);

    task.halt();

    await expect(task).rejects.toHaveProperty('message', 'halted')
    expect(task.state).toEqual('halted');
    expect(task.result).toEqual(undefined);
  });

  describe('function', () => {
    it('runs a promise to completion', async () => {
      let task = run((task) => Promise.resolve(123))
      await expect(task).resolves.toEqual(123);
      expect(task.state).toEqual('completed');
      expect(task.result).toEqual(123);
    });

    it('rejects a failed promise', async () => {
      let error = new Error('boom');
      let task = run((task) => Promise.reject(error))
      await expect(task).rejects.toEqual(error);
      expect(task.state).toEqual('errored');
      expect(task.error).toEqual(error);
    });

    it('can halt a promise', async () => {
      let promise = new Promise(() => {});
      let task = run((task) => promise);

      task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted')
      expect(task.state).toEqual('halted');
      expect(task.result).toEqual(undefined);
    });
  });
});
