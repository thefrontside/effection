import { asyncResource } from '../setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { run, sleep, withTimeout } from '../../src/index';

describe('withTimeout', () => {
  it('completes normally when completed before timeout', async () => {
    let root = run(withTimeout(10, function*() {
      yield sleep(5);
      return "foo";
    }));

    await expect(root).resolves.toEqual("foo");
  });

  it('throws an error after the given amount of time', async () => {
    let root = run(withTimeout(5, function*() {
      yield sleep(10);
      return "foo";
    }));

    await expect(root).rejects.toHaveProperty('message', 'timed out after 5ms');
  });

  describe("with resource", () => {
    it("resolves when resources resolves before timeout", async () => {
      await run(function*() {
        let fooStatus = { status: 'pending' };
        let result = yield withTimeout(30, asyncResource(10, "foo", fooStatus));

        expect(result).toEqual('foo');
        expect(fooStatus.status).toEqual('pending');
        yield sleep(60);
        expect(fooStatus.status).toEqual('active');
      });
    });

    it("rejects when one of the operations reject", async () => {
      await run(function*() {
        let fooStatus = { status: 'pending' };
        let error;
        try {
          yield withTimeout(10, asyncResource(30, "foo", fooStatus));
        } catch(err) {
          error = err;
        }

        expect(error).toHaveProperty("message", "timed out after 10ms");
        yield sleep(60);
        expect(fooStatus.status).toEqual('pending');
      });
    });
  });

  it('applies labels', () => {
    expect(run(withTimeout(200, function*() { /* no op */ })).labels).toEqual({ name: 'withTimeout', duration: 200 });
  });
});
