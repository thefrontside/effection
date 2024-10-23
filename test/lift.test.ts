import { lift, run, spawn, withResolvers } from "../mod.ts";
import { describe, expect, it } from "./suite.ts";

describe("lift", () => {
  it("safely does not continue if the call stops the operation", async () => {
    let reached = false;

    await run(function* main() {
      let resolvers = withResolvers<string>();
      yield* spawn(function* lifter() {
        yield* lift(resolvers.resolve)("resolve it!");
        reached = true;
      });

      yield* resolvers.operation;
    });

    expect(reached).toEqual(false);
  });
});
