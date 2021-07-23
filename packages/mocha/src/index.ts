/* eslint-disable @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-explicit-any */
import mocha from 'mocha';
import { run, Task, Effection, Operation } from '@effection/core';

let world: Task | undefined;

type TestFunction = (this: mocha.Context, world: Task, scope: Task) => Generator<Operation<any>, any, any>;

interface ItFunction {
  (title: string, fn?: TestFunction): void;
  only(title: string, fn: TestFunction): void;
  skip(title: string, fn: TestFunction): void;
}

mocha.beforeEach(async function() {
  await Effection.reset();
  world = run();
});

mocha.afterEach(async function() {
  world!.halt();
  await world!.catchHalt();
  world = undefined;
  await Effection.halt();
});

function runInWorld(fn: TestFunction) {
  return async function(this: mocha.Context) {
    await run({ init: fn.bind(this) }, { resourceScope: world! });
  };
}

export const describe = mocha.describe;

export const beforeEach = (fn: TestFunction) => mocha.beforeEach(runInWorld(fn));
export const afterEach = (fn: TestFunction) => mocha.afterEach(runInWorld(fn));

export const it: ItFunction = Object.assign(
  (title: string, fn?: TestFunction) => mocha.it(title, fn ? runInWorld(fn): fn),
  {
    only: (title: string, fn: TestFunction) => mocha.it.only(title, runInWorld(fn)),
    skip: (title: string, fn: TestFunction) => mocha.it.skip(title, runInWorld(fn)),
  }
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
