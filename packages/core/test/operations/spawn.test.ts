import '../setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { run, spawn, sleep, createFuture, Operation } from '../../src/index';

describe('spawn', () => {
  it('can spawn a new child task', async () => {
    let root = run(function*() {
      let child: Operation<string> = yield spawn(function*() {
        yield sleep(5);
        return 'foo';
      });

      let result: string = yield child;
      return result;
    });
    await expect(root).resolves.toEqual('foo');
    expect(root.state).toEqual('completed');
  });

  it('can spawn a new child task in the given scope', async () => {
    let { future, produce } = createFuture<string>();
    run(function*(scope) {
      yield function*() {
        yield scope.spawn(function*() {
          yield sleep(5);
          produce({ state: 'completed', value: 'foo' });
        });
      };
      yield;
    });
    await expect(future).resolves.toEqual('foo');
  });
});
