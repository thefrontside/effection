import '../setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { run, sleep, timeout } from '../../src/index';

describe('timeout', () => {
  it('throws an error after the given amount of time', async () => {
    let root = run(timeout(10));

    await run(sleep(5));
    expect(root.state).toEqual('running');
    await run(sleep(10));
    expect(root.state).toEqual('errored');
    await expect(root).rejects.toHaveProperty('message', 'timed out after 10ms');
  });

  it('applies labels', () => {
    expect(run(timeout(200)).labels).toEqual({ name: 'timeout', duration: 200 });
  });
});
