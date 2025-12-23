import type { Operation } from "effection";
import {
  afterAll as $afterAll,
  describe as $describe,
  it as $it,
} from "@std/testing/bdd";
import { createTestAdapter, type TestAdapter } from "./testing/adapter.ts";

let current: TestAdapter | undefined;

export function describe(name: string, body: () => void) {
  const isTop = !current;
  const original = current;
  try {
    const child = current = createTestAdapter({ name, parent: original });
    if (isTop) {
      //
    }

    $describe(name, () => {
      $afterAll(() => child.destroy());
      body();
    });
  } finally {
    current = original;
  }
}

describe.skip = $describe.skip;
describe.only = $describe.only;

export function beforeEach(body: () => Operation<void>) {
  current?.addSetup(body);
}

export function it(desc: string, body?: () => Operation<void>): void {
  const adapter = current!;
  if (!body) {
    return $it.skip(desc, () => {});
  }
  $it(desc, async () => {
    const result = await adapter.runTest(body);
    if (!result.ok) {
      throw result.error;
    }
  });
}

it.skip = (...args: Parameters<typeof it>): ReturnType<typeof it> => {
  const [desc] = args;
  $it.skip(desc, () => {});
};

it.only = (desc: string, body: () => Operation<void>): void => {
  const adapter = current!;
  $it.only(desc, async () => {
    const result = await adapter.runTest(body);
    if (!result.ok) {
      throw result.error;
    }
  });
};
