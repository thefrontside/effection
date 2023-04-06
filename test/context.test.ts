import { describe, expect, it } from "./suite.ts";

import { createContext, run } from "../mod.ts";

const numbers = createContext("numbers", [3]);

describe("context", () => {
  it("has the initial value available at all times", async () => {
    expect(
      await run(function* () {
        return yield* numbers;
      }),
    ).toEqual([3]);
  });

  // it.only("can be refined, but it restores ater evaluation", async () => {
  //   let before = [] as number[];
  //   let after = [] as number[];
  //   let beforeInner = [] as number[]
  //   let afterInner = [] as number[]
  //   let inner = [] as number[];
  //   let result = await run(function* outer() {
  //     before = yield* numbers;
  //     let result = yield* numbers.refine(a => a.concat(2), function* middle() {
  //       beforeInner = yield* numbers;
  //       let result = yield* numbers.refine(b => b.concat(1), function* inside() {
  //         inner = yield* numbers;
  //         return "hi";
  //       });
  //       afterInner = yield* numbers;
  //       return result;
  //     });
  //     after = yield* numbers;
  //     return result;
  //   });
  //   expect(result).toEqual("hi");
  //   expect(before).toEqual([3]);
  //   expect(beforeInner).toEqual([3,2])
  //   expect(inner).toEqual([3,2,1]);
  //   expect(afterInner).toEqual([3,2])
  //   expect(after).toEqual([3])
  // })
});
