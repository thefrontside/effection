import { describe, beforeEach, it } from 'mocha';
import * as expect from 'expect';

import { run } from '../src/index';

describe('run', () => {
  it('runs a promise to completion', () => {
    let task = run(Promise.resolve(123))
    expect(task).resolves.toEqual(123);
  });

  it('can compose multiple promises via generator', () => {
    let task = run(function*() {
      let one: number = yield Promise.resolve(12);
      let two: number = yield Promise.resolve(55);
      return one + two;
    });
    expect(task).resolves.toEqual(67);
  });

  it('can halt a promise', async () => {
    let promise = new Promise(() => {});
    let task = run(promise);

    task.halt();

    await expect(task).rejects.toHaveProperty("message", "halted")
  });
});
