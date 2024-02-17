import * as bdd from "https://deno.land/std@0.163.0/testing/bdd.ts";
import { TestScope, createTestScope } from "./TestScope.ts";
import type { Operation } from "effection";

let scope: TestScope | void = void 0;

// Integrate test scope with the Deno test runner by wrapping the `describe()`, `it()` and `beforeEach()` methods.
function describeWithScope<T>(...args: bdd.DescribeArgs<T>): bdd.TestSuite<T> {
  let [name, def] = args;
  return bdd.describe(name as string, () => {
    bdd.beforeEach(() => {
      if (!scope) {
        scope = createTestScope();
      }
    });

    if (def && typeof def === "function") {
      def();
    }
  });
}

describeWithScope.only = bdd.describe.only;
describeWithScope.ignore = bdd.describe.ignore;

export const describe: typeof bdd.describe = describeWithScope;

export function beforeEach(op: () => Operation<void>): void {
  bdd.beforeEach(() => scope!.addSetup(op));
}

export function it(desc: string, op?: () => Operation<void>): void {
  if (op) {
    return bdd.it(desc, () => scope!.runTest(op));
  } else {
    return bdd.it.ignore(desc, () => {});
  }
}

it.only = function only(desc: string, op?: () => Operation<void>): void {
  if (op) {
    return bdd.it.only(desc, () => scope!.runTest(op));
  } else {
    return bdd.it.ignore(desc, () => {});
  }
};
