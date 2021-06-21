import '../setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { run, sleep, ensure } from '../../src/index';

describe('ensure', () => {
  it('runs the given operation at the end of the task', async () => {
    let state = 'pending';

    let root = run(function*() {
      yield sleep(10);
      yield ensure(function*() {
        state = 'started';
        yield sleep(10);
        state = 'completed';
      });
    });

    await run(sleep(5));
    expect(state).toEqual('pending');
    await run(sleep(10));
    expect(state).toEqual('started');
    await root
    expect(state).toEqual('completed');
    expect(root.state).toEqual('completed');
  });

  it('runs the given function at the end of the task', async () => {
    let state = 'pending';

    let root = run(function*() {
      yield sleep(10);
      yield ensure(() => {
        state = 'completed';
      });
    });

    await run(sleep(5));
    expect(state).toEqual('pending');
    await root
    expect(state).toEqual('completed');
    expect(root.state).toEqual('completed');
  });
});
