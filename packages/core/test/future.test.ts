import './setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { createFuture } from '../src/index';

describe('Future', () => {
  it('can be resolved', async () => {
    let { future, resolve } = createFuture();
    resolve(123);
    await expect(future).resolves.toEqual(123);
  });

  it('can be rejected', async () => {
    let error = new Error('boom');
    let { future, reject } = createFuture();
    reject(error);
    await expect(future).rejects.toEqual(error);
  });

  it('can be halted', async () => {
    let { future, halt } = createFuture();
    halt();
    await expect(future).rejects.toHaveProperty('message', 'halted');
  });

  it('can produce value', async () => {
    let { future, produce } = createFuture();
    produce({ state: 'completed', value: 123 });
    await expect(future).resolves.toEqual(123);
  });
});
