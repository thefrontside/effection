import {
  Effection,
  Resource,
  Task,
  sleep,
  Operation,
  race,
  run,
} from 'effection';
import * as vitestGlobals from 'vitest';
import type {
  // TestFunction,
  Suite,
  // File,
  TestContext,
} from 'vitest';
import { assert } from 'assert-ts';

export interface TestFn {
  (
    context: TestContext & Record<string, unknown>,
    suite: Suite,
    world: Task,
    scope: Task
  ): ReturnType<Resource<void>['init']>;
}

export interface TestSuite {
  (suiteOrFile: Suite | File, world: Task, scope: Task): ReturnType<
    Resource<void>['init']
  >;
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

const scopes = {} as {
  all: Task | undefined;
  each: Task | undefined;
};

async function withinScope(
  name: keyof typeof scopes,
  fn: (task: Task) => Promise<void>
): Promise<void> {
  let scope = scopes[name];
  assert(!!scope, `critical: test scope '${name}' was not initialized`);
  if (scope.state === 'errored' || scope.state === 'erroring') {
    await scope;
  }
  await fn(scope);
  if (scope.state === 'errored' || scope.state === 'erroring') {
    await scope;
  }
}

function runInAllScope(fn: TestSuite, name: string) {
  return async function (suiteOrFile: Suite | File) {
    await withinScope('all', async (all) => {
      await all
        .run({
          name,
          init: fn.bind(undefined, suiteOrFile),
        })
        .catchHalt();
    });
  };
}

function runInEachScope(fn: TestFn, name: string) {
  async function runner(
    context: TestContext & Record<string, unknown>
  ): Promise<void>
  async function runner(
    context: TestContext & Record<string, unknown>,
    suite?: Suite
  ): Promise<void> {
    await withinScope('all', async () => {
      await withinScope('each', async (each) => {
        await each
          .run({
            name,
            init: fn.bind(undefined, context, suite as Suite),
          })
          .catchHalt();
      });
    });
  }

  return runner;
}

vitestGlobals.beforeAll(async () => {
  await Effection.reset();
  scopes.all = run(undefined, { labels: { name: 'allScope' } });
});

vitestGlobals.afterAll(async () => {
  scopes.all = undefined;
  await Effection.halt();
});

vitestGlobals.beforeEach(async () => {
  scopes.each = run(undefined, { labels: { name: 'eachScope' } });
});

vitestGlobals.afterEach(async () => {
  let each = scopes.each;
  if (!!each) {
    each.halt();
    await each.catchHalt();
    scopes.each = undefined;
  }
});

export function beforeAll(fn: TestSuite, timeout?: number): void {
  return vitestGlobals.beforeAll(runInAllScope(fn, 'beforeAll'), timeout);
}

export function beforeEach(fn: TestFn, timeout?: number): void {
  return vitestGlobals.beforeEach(runInEachScope(fn, 'beforeEach'), timeout);
}

export const describe = vitestGlobals.describe;

export const it: It = Object.assign(
  function it(name: string, fn: TestFn, timeout?: number) {
    return vitestGlobals.it(
      name,
      runInEachScope(fn, `it(${JSON.stringify(name)})`),
      timeout
    );
  },
  {
    only(name: string, fn: TestFn, timeout?: number): void {
      return vitestGlobals.it.only(
        name,
        runInEachScope(fn, `it(${JSON.stringify(name)})`),
        timeout
      );
    },
    skip(name: string, fn: TestFn, timeout?: number): void {
      return vitestGlobals.it.skip(
        name,
        runInEachScope(fn, `it(${JSON.stringify(name)})`),
        timeout
      );
    },
    todo(name: string): void {
      return vitestGlobals.it.todo(name);
    },
    eventually(name: string, fn: TestFn, testTimeout?: number) {
      let limit =
        testTimeout ??
        // @ts-expect-error this is real hacky, but really any other options
        globalThis?.['__vitest_worker__']?.config?.testTimeout ??
        5000;

      return it(
        name,
        function* (context, suite, scope, current) {
          let operation = fn.bind(undefined, context, suite);
          let error = new Error(
            `operation never succeeded within the ${limit}ms limit`
          );
          function* trial(): Operation<void> {
            while (true) {
              try {
                yield operation(scope, current);
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
        limit * 3
      );
    },
  }
);
export const test = it;

export function captureError(
  op: Operation<unknown>
): Operation<unknown | Error> {
  return function* () {
    try {
      yield op;
    } catch (error) {
      return error;
    }
    throw new Error('expected operation to throw an error, but it did not!');
  };
}
