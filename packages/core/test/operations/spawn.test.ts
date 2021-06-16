import '../setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { run, spawn, sleep, createFuture } from '../../src/index';

describe('spawn', () => {
  it('can spawn a new child task', async () => {
    let root = run(function*() {
      let child = yield spawn(function*() {
        yield sleep(5);
        return 'foo';
      });

      return yield child;
    });
    await expect(root).resolves.toEqual('foo');
    expect(root.state).toEqual('completed');
  });

  it('can spawn a new child task in the given scope', async () => {
    let { future, resolve } = createFuture<string>();
    run(function*(scope) {
      yield function*() {
        yield spawn(function*() {
          yield sleep(5);
          resolve({ state: 'completed', value: 'foo' });
        }).within(scope);
      };
      yield;
    });
    await expect(future).resolves.toEqual('foo');
  });
});
