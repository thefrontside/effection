import { createFetchOperation } from "../lib/fetch.ts";
import { Operation, run, spawn } from "../mod.ts";
import { beforeEach, describe, expect, it } from "./suite.ts";

describe("createEffectionFetch", () => {
  it("creates an operation that resolves with the result on success", async () => {
    let result = await run(function* () {
      let fetchOperation = createFetchOperation(() => {
        return Promise.resolve({
          text() {
            return "success";
          },
        } as unknown as Response);
      });

      return yield* fetchOperation("example.com");
    });

    expect(result.text()).toBe("success");
  });

  it("creates an operation that receives abort controller when cancelled", async () => {
    let _signal: AbortSignal | undefined;
    let _recievedSignal: boolean | undefined;

    let fetchOperation = createFetchOperation((_, init) => {
      if (init && init.signal) {
        _signal = init.signal;

        return new Promise((resolve, reject) => {
          if (_signal) {
            _signal.addEventListener("abort", () => {
              _recievedSignal = true;
              reject(new Error("AbortError"));
            });
          }

          resolve({
            text() {
              return "success";
            },
          } as unknown as Response);
        });
      } else {
        return Promise.resolve({
          text() {
            return "this should never happen";
          },
        } as unknown as Response);
      }
    });

    try {
      await run(function* () {
        yield* spawn(() => fetchOperation("example.com"));

        throw new Error();
      });
    } catch {}

    expect(_signal).not.toBeUndefined();
    expect(_recievedSignal).toBe(true);
  });
});
