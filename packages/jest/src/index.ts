/* eslint-disable @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-explicit-any */
import { Effection, Resource, Task, sleep, Operation, race, run } from 'effection';
import type { Global } from '@jest/types';
import { getState } from 'jest-circus';

import * as jestGlobals from '@jest/globals';
import { assert } from 'assert-ts';

export interface TestFn {
  (this: Global.TestContext, world: Task, scope: Task): ReturnType<Resource<void>['init']>;
}

export interface ItFn {
  (title: string, fn: TestFn, timeout?: number): void;
}

export interface It extends ItFn {
  only: ItFn;
  skip: ItFn;
  eventually: ItFn;
  todo(title: string): void;
}

let allScope: Task | undefined;
let eachScope: Task | undefined;

function runInEachScope(fn: TestFn, name: string): Global.TestFn {
  return async function (this: Global.TestContext | undefined) {
    assert(!!eachScope, 'critical: eachScope not initialized');
    await eachScope
      .run({
        name,
        init: fn.bind(this ?? {}),
      })
      .catchHalt();
    if (eachScope.state === 'errored') {
      await eachScope;
    }
  };
}

function runInAllScope(fn: TestFn, name: string): Global.TestFn {
  return async function (this: Global.TestContext | undefined) {
    assert(!!allScope, 'critical: allScope not initialized');
    await allScope
      .run({
        name,
        init: fn.bind(this ?? {}),
      })
      .catchHalt();
    if (allScope.state === 'errored') {
      await allScope;
    }
  };
}

jestGlobals.beforeAll(async () => {
  await Effection.reset();
  allScope = run(undefined, { labels: { name: 'allScope' } });
});

jestGlobals.afterAll(async () => {
  allScope = undefined;
  await Effection.halt();
});

jestGlobals.beforeEach(async () => {
  assert(!!allScope, 'critical: universe not initialized');
  eachScope = allScope.run(undefined, { labels: { name: 'eachScope' } });
});

jestGlobals.afterEach(async () => {
  if (!!eachScope) {
    eachScope.halt();
    await eachScope.catchHalt();
    eachScope = undefined;
  }
});

export function beforeAll(fn: TestFn, timeout?: number): void {
  return jestGlobals.beforeAll(runInAllScope(fn, 'beforeAll'), timeout);
}

export function beforeEach(fn: TestFn, timeout?: number): void {
  return jestGlobals.beforeEach(runInEachScope(fn, 'beforeEach'), timeout);
}

export const describe = jestGlobals.describe;

export const it: It = Object.assign(
  function it(name: string, fn: TestFn, timeout?: number) {
    return jestGlobals.it(name, runInEachScope(fn, `it(${JSON.stringify(name)})`), timeout);
  },
  {
    only(name: string, fn: TestFn, timeout?: number): void {
      return jestGlobals.it.only(name, runInEachScope(fn, `it(${JSON.stringify(name)})`), timeout);
    },
    skip(name: string, fn: TestFn, timeout?: number): void {
      return jestGlobals.it.skip(name, runInEachScope(fn, `it(${JSON.stringify(name)})`), timeout);
    },
    todo(name: string): void {
      return jestGlobals.it.todo(name);
    },
    eventually(name: string, fn: TestFn, testTimeout?: number) {
      let limit = testTimeout ?? getState().testTimeout;

      return it(
        name,
        function* () {
          let error = new Error(`operation never succeeded within the ${limit}ms limit`);
          function* trial(): Operation<void> {
            while (true) {
              try {
                yield runInEachScope(fn, name);
                break;
              } catch (e) {
                error = e as Error;
                yield sleep(1);
              }
            }
          }
          function* timeout() {
            yield sleep(limit);
            throw error;
          }
          yield race([trial, timeout]);
        },
        limit * 3,
      );
    },
  },
);

export function captureError(op: Operation<any>): Operation<Error> {
  return function*() {
    try {
      yield op;
    } catch(error) {
      return error;
    }
    throw new Error('expected operation to throw an error, but it did not!');
  };
}
