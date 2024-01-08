import { run, sleep, Task } from "../mod.ts";
import { afterEach, beforeEach, describe, expect, it } from "../test/suite.ts";
import { CustomError, retryBackoffExample } from "./retry-backoff.ts";
/**
 * Requirements:
 *  * only retry if the error matches specific error/s (otherwise fail)
 *  * begin with a delay of startDelay ms between retries
 *  * double the delay each retry attempt up to a max of maxDelay ms
 *  * retry a maximum of 5 times
 * Source: https://discord.com/channels/795981131316985866/1125094089281511474/1189299794145988748
 */
describe("retry-backoff-example", () => {
  it("fails for unknown errors", () => {
    expect(run(function* () {
      yield* retryBackoffExample(function* () {
        throw new Error("RandomError");
      });
    })).rejects.toMatch(/RandomError/);
  });

  describe("retries", () => {
    describe("known errors", () => {
      let task: Task<void>;
      let retries: number;
      beforeEach(async () => {
        retries = -1;
        task = run(function* () {
          yield* retryBackoffExample(function* () {
            retries++;
            throw new CustomError("LockTimeout");
          });
        });
        try {
          await task;
        } catch {}
      });
      it("rejects to a known error", async () => {
        await expect(task).rejects.toEqual({
          _tag: "LockTimeout",
        });
      });
      it("5 times", () => {
        expect(retries).toBe(5);
      });
    });
    // describe("delay", () => {
    //   let task: Task<void>;
    //   let backoffs: number[];
    //   let attempt: number;
    //   let start: number;
    //   beforeEach(async () => {
    //     attempt = 0;
    //     backoffs = [];
    //     task = run(function* () {
    //       start = performance.now();
    //       yield* retryBackoffExample(function* () {
    //         if (attempt > 0) {
    //           backoffs.push(performance.now() - start);
    //         }
    //         attempt++;
    //         throw new CustomError('LockTimeout');
    //       });
    //     });
    //     try {
    //       await task;
    //     } catch { }
    //   });
    //   it("doubles backoffs at every attempt", () => {
    //     expect(backoffs).toEqual([5, 10, 20, 40, 80])
    //   });
    // });
    describe("timeout", () => {
      let task: Task<void>;
      beforeEach(async () => {
        let retry = 0;
        task = run(function* () {
          yield* retryBackoffExample(function* () {
            if (retry > 0) {
              yield* sleep(200);
            }
            retry++;
            throw new CustomError("ConflictDetected");
          }, { maxDelay: 100 });
        });
        try {
          await task;
        } catch (e) {
          console.log(e);
        }
      });
      it("throws an error", async () => {
        await expect(task).rejects.toMatch(/Timeout/);
      });
    });
  });
});
