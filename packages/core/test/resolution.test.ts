import './setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { run } from '../src/index';

describe('resolution function', () => {
  it('resolves when resolve is called', async () => {
    let task = run(() => {
      return (resolve) => {
        setTimeout(() => resolve(123), 5)
      }
    });
    await expect(task).resolves.toEqual(123);
    expect(task.state).toEqual('completed');
  });

  it('rejects when reject is called', async () => {
    let task = run(() => {
      return (resolve, reject) => {
        setTimeout(() => reject(new Error('boom')), 5)
      }
    });
    await expect(task).rejects.toHaveProperty('message', 'boom');
    expect(task.state).toEqual('errored');
  });

  it('rejects when error is thrown in function', async () => {
    let task = run(() => {
      return () => {
        throw new Error('boom');
      }
    });
    await expect(task).rejects.toHaveProperty('message', 'boom');
    expect(task.state).toEqual('errored');
  });

  it('can be halted', async () => {
    let task = run(() => {
      return () => {
        // never resolves
      }
    });

    await task.halt();

    await expect(task).rejects.toHaveProperty('message', 'halted')
    expect(task.state).toEqual('halted');
  });
});
