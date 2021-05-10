import '../setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { run, spawn, sleep, Deferred } from '../../src/index';

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
    let deferred = Deferred<string>();
    run(function*(scope) {
      yield function*() {
        yield spawn(function*() {
          yield sleep(5);
          deferred.resolve('foo');
        }).within(scope);
      };
      yield;
    });
    await expect(deferred.promise).resolves.toEqual('foo');
  });
});
