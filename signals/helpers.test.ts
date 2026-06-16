import { describe, it } from "@effectionx/vitest";
import { expect } from "expect";
import { spawn, withResolvers } from "effection";
import { timebox } from "@effectionx/timebox";

import { createBooleanSignal } from "./boolean.ts";
import { createArraySignal } from "./array.ts";
import { is } from "./helpers.ts";

describe("is", () => {
  it("waits until the value of the stream matches the predicate", function* () {
    const open = yield* createBooleanSignal(false);
    const update: string[] = [];

    const { resolve, operation } = withResolvers<void>();

    yield* spawn(function* () {
      yield* is(open, (open) => open === true);
      update.push("floodgates are open!");
      resolve();
    });

    yield* spawn(function* () {
      open.set(true);
    });

    yield* operation;

    expect(update).toEqual(["floodgates are open!"]);
  });

  it("completes immediately when the current value already matches", function* () {
    const open = yield* createBooleanSignal(true);

    const result = yield* timebox(1000, () =>
      is(open, (open) => open === true),
    );

    expect(result.timeout).toEqual(false);
    expect(open.valueOf()).toEqual(true);
  });

  it("completes on the first matching update after non-matching updates", function* () {
    const count = yield* createArraySignal<number>([]);

    const { resolve, operation } = withResolvers<void>();
    const seen: number[] = [];

    yield* spawn(function* () {
      yield* is(count, (xs) => xs.length >= 3);
      seen.push(count.length);
      resolve();
    });

    yield* spawn(function* () {
      count.push(1);
      count.push(2);
      count.push(3);
    });

    yield* operation;

    expect(seen).toEqual([3]);
    expect(count.valueOf()).toEqual([1, 2, 3]);
  });

  // Regression for #217: a matching change that lands between observing the
  // initial state and establishing the subscription must not be lost. The
  // producer publishes immediately with no sleep or preliminary yield. The
  // timebox deadline is only a diagnostic bound — it does not coordinate the
  // producer and consumer — so a lost update surfaces as a timeout failure
  // rather than a hang.
  it("completes on a match that lands during subscription setup", function* () {
    const open = yield* createBooleanSignal(false);

    const result = yield* timebox(1000, function* () {
      yield* spawn(function* () {
        open.set(true);
      });
      yield* is(open, (open) => open === true);
    });

    expect(result.timeout).toEqual(false);
    expect(open.valueOf()).toEqual(true);
  });
});
