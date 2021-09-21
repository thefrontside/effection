import { asyncResolve, asyncReject, syncResolve, syncReject, asyncResource } from '../setup';
import { describe, it } from 'mocha';
import expect from 'expect';

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

  describe("with resource", () => {
    it("resolves when all resources resolve", async () => {
      await run(function*() {
        let fooStatus = { status: 'pending' };
        let barStatus = { status: 'pending' };
        let result = yield all([
          asyncResource(10, "foo", fooStatus),
          asyncResource(30, "bar", barStatus),
        ]);

        expect(result).toEqual(['foo', 'bar']);
        expect(fooStatus.status).toEqual('active');
        expect(barStatus.status).toEqual('pending');
        yield sleep(20);
        expect(barStatus.status).toEqual('active');
      });
    });

    it("rejects when one of the operations reject", async () => {
      await run(function*() {
        let fooStatus = { status: 'pending' };
        let error;
        try {
          yield all([
            asyncResource(20, "foo", fooStatus),
            asyncReject(10, "bar"),
          ]);
        } catch(err) {
          error = err;
        }

        expect(fooStatus.status).toEqual('pending');
        expect(error).toHaveProperty("message", "boom: bar");
        yield sleep(40);
        expect(fooStatus.status).toEqual('pending');
      });
    });
  });

  it('applies labels', () => {
    expect(run(all([syncResolve("foo")])).labels).toEqual({ name: 'all', count: 1 });
  });
});
