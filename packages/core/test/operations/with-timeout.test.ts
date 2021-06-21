import '../setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { run, sleep, withTimeout } from '../../src/index';

describe('withTimeout', () => {
  it('completes normally when completed before timeout', async () => {
    let root = run(withTimeout(10, function*() {
      yield sleep(5);
      return "foo"
    }));

    await expect(root).resolves.toEqual("foo");
  });

  it('throws an error after the given amount of time', async () => {
    let root = run(withTimeout(5, function*() {
      yield sleep(10);
      return "foo"
    }));

    await expect(root).rejects.toHaveProperty('message', 'timed out after 5ms');
  });

  it('applies labels', () => {
    expect(run(withTimeout(200, function*() { /* no op */ })).labels).toEqual({ name: 'withTimeout', duration: 200 });
  });
});
