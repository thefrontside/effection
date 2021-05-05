import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect';

import { Operation, Deferred, Task, race, run, sleep } from '../../src/index';

function *asyncResolve(duration: number, value: string): Operation<string> {
  yield sleep(duration);
  return value;
}

function *asyncReject(duration: number, value: string): Operation<string> {
  yield sleep(duration);
  throw new Error(`boom: ${value}`);
}

function *syncResolve(value: string): Operation<string> {
  return value;
}

function *syncReject(value: string): Operation<string> {
  throw new Error(`boom: ${value}`);
}

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

  it('resolves synchronously when one of the given operations resolves synchronously first', async () => {
    let result = run(race([
      syncResolve("foo"),
      syncResolve("bar"),
      syncReject("baz"),
    ]));

    expect(result).resolves.toEqual('foo');
  });

  it('rejects synchronously when one of the given operations rejects synchronously first', async () => {
    let result = run(race([
      syncReject("foo"),
      syncResolve("bar"),
      syncReject("baz"),
    ]));

    expect(result).rejects.toHaveProperty('message', 'boom: foo');
  });
});
