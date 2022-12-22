import { asyncResolve, asyncReject, syncResolve, syncReject, asyncResource } from '../setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { race, run, sleep } from '../../src/index';

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

  describe("with resource", () => {
    it("resolves when first resources resolves", async () => {
      await run(function*() {
        let fooStatus = { status: 'pending' };
        let barStatus = { status: 'pending' };
        let result: string = yield race([
          asyncResource(10, "foo", fooStatus),
          asyncResource(30, "bar", barStatus),
        ]);

        expect(result).toEqual('foo');
        expect(fooStatus.status).toEqual('pending');
        yield sleep(60);
        expect(fooStatus.status).toEqual('active');
        expect(barStatus.status).toEqual('pending');
      });
    });

    it("rejects when one of the operations reject", async () => {
      await run(function*() {
        let fooStatus = { status: 'pending' };
        let error;
        try {
          yield race([
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
    expect(run(race([syncResolve("foo")])).labels).toEqual({ name: 'race', count: 1 });
  });
});
