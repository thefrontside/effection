import { asyncResolve, asyncReject, syncResolve, syncReject } from '../setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { all, run, sleep } from '../../src/index';

describe('all()', () => {
  it('resolves when the given list is empty', async () => {
    let result = run(all([]));

    await expect(result).resolves.toEqual([]);
  });

  it('resolves when all of the given operations resolve', async () => {
    let result = run(all([
      syncResolve("quox"),
      asyncResolve(10, "foo"),
      asyncResolve(5, "bar"),
      asyncResolve(15, "baz"),
    ]));

    await expect(result).resolves.toEqual(['quox', 'foo', 'bar', 'baz']);
  });

  it('rejects when one of the given operations rejects asynchronously first', async () => {
    let result = run(all([
      asyncResolve(10, "foo"),
      asyncReject(5, "bar"),
      asyncResolve(15, "baz"),
    ]));

    await expect(result).rejects.toHaveProperty('message', 'boom: bar');
  });

  it('rejects when one of the given operations rejects asynchronously and another operation does not complete', async () => {
    let result = run(all([
      sleep(),
      asyncReject(5, "bar"),
    ]));

    await expect(result).rejects.toHaveProperty('message', 'boom: bar');
  });

  it('resolves when all of the given operations resolve synchronously', async () => {
    let result = run(all([
      syncResolve("foo"),
      syncResolve("bar"),
      syncResolve("baz"),
    ]));

    await expect(result).resolves.toEqual(['foo', 'bar', 'baz']);
  });

  it('rejects when one of the given operations rejects synchronously first', async () => {
    let result = run(all([
      syncResolve("foo"),
      syncReject("bar"),
      syncResolve("baz"),
    ]));

    await expect(result).rejects.toHaveProperty('message', 'boom: bar');
  });
});
