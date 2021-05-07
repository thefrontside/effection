import '../setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { run, Task, spawn, sleep } from '../../src/index';

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
});
