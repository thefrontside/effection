import { Task, run } from "../mod.ts";
import { beforeEach, describe, expect, it } from "../test/suite.ts";
import { CustomError, retryBackoffExample } from "./retry-backoff.ts";
/**
 * Requirements:
 *  * only retry if the error matches specific error/s (otherwise fail)
 *  * begin with a delay of startDelay ms between retries
 *  * double the delay each retry attempt up to a max of maxDelay ms
 *  * retry a maximum of 5 times
 * Source: https://discord.com/channels/795981131316985866/1125094089281511474/1189299794145988748
 */
describe("retry-backoff", () => {
  it("fails for unknown errors", () => {
    expect(run(function* () {
      yield* retryBackoffExample(function* () {
        throw new Error('RandomError');
      });
    })).rejects.toMatch(/RandomError/)
  });

  describe("retries", () => {
    describe("known errors", () => {
      let task: Task<void>;
      let retries: number;
      beforeEach(() => {
        retries = 0;
        task = run(function* () {
          yield* retryBackoffExample(function*() {
            retries++;
            throw new CustomError('LockTimeout');
          });
        });
      });
      it("rejects to a known error", () => {
        expect(task).rejects.toEqual({
          _tag: 'LockTimeout'
        });
      });
      it("5 times", () => {
        expect(retries).toBe(5);
      });
    });
  })
})