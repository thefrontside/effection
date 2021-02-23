import './setup';
import { describe, beforeEach, it } from 'mocha';
import * as expect from 'expect';

import { run, sleep } from '../src/index';

describe('suspend', () => {
  it('suspends indefinitely', async () => {
    let task = run();

    await run(sleep(10));

    expect(task.state).toEqual('running');
  });

  it('can be halted', async () => {
    let task = run();

    await task.halt();

    await expect(task).rejects.toHaveProperty('message', 'halted')
    expect(task.state).toEqual('halted');
    expect(task.result).toEqual(undefined);
  });
});
