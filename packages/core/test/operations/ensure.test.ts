import '../setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { run, sleep, ensure } from '../../src/index';

describe('ensure', () => {
  it('runs the given operation at the end of the task', async () => {
    let state = 'pending';

    let root = run(function*(task) {
      yield sleep(10);
      task.spawn(ensure(function*() {
        state = 'started';
        yield sleep(10);
        state = 'completed';
      }));
    });

    await run(sleep(5));
    expect(state).toEqual('pending');
    await run(sleep(10));
    expect(state).toEqual('started');
    await root
    expect(state).toEqual('completed');
    expect(root.state).toEqual('completed');
  });
});
