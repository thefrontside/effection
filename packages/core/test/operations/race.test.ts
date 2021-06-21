import { asyncResolve, asyncReject, syncResolve, syncReject } from '../setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { race, run } from '../../src/index';

describe('race()', () => {
  it('resolves when one of the given operations resolves asynchronously first', async () => {
    let result = run(race([
      asyncResolve(10, "foo"),
      asyncResolve(5, "bar"),
      asyncReject(15, "baz"),
    ]));

    await expect(result).resolves.toEqual('bar');
  });

  it('rejects when one of the given operations rejects asynchronously first', async () => {
    let result = run(race([
      asyncResolve(10, "foo"),
      asyncReject(5, "bar"),
      asyncReject(15, "baz"),
    ]));

    await expect(result).rejects.toHaveProperty('message', 'boom: bar');
  });

  it('resolves when one of the given operations resolves synchronously first', async () => {
    let result = run(race([
      syncResolve("foo"),
      syncResolve("bar"),
      syncReject("baz"),
    ]));

    await expect(result).resolves.toEqual('foo');
  });

  it('rejects when one of the given operations rejects synchronously first', async () => {
    let result = run(race([
      syncReject("foo"),
      syncResolve("bar"),
      syncReject("baz"),
    ]));

    await expect(result).rejects.toHaveProperty('message', 'boom: foo');
  });

  it('applies labels', () => {
    expect(run(race([syncResolve("foo")])).labels).toEqual({ name: 'race', count: 1 });
  });
});
