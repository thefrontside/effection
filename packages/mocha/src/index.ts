/* eslint-disable @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-explicit-any */
import mocha from 'mocha';
import { run, Task, Effection, Operation } from 'effection';

let world: Task | undefined;

type TestFunction = (this: mocha.Context, world: Task, scope: Task) => Generator<Operation<any>, any, any>;

interface ItFunction {
  (title: string, fn?: TestFunction): void;
  only(title: string, fn: TestFunction): void;
  skip(title: string, fn: TestFunction): void;
}

mocha.beforeEach(async function() {
  await Effection.reset();
  world = run(undefined, { labels: { name: 'world' } });
});

mocha.afterEach(async function() {
  world!.halt();
  await world!.catchHalt();
  world = undefined;
  await Effection.halt();
});

function runInWorld(fn: TestFunction, name = "test") {
  return async function(this: mocha.Context) {
    await world!.run((local) => fn.bind(this)(world!, local), { ignoreError: true, yieldScope: world!, labels: { name } });
  };
}

export const describe = mocha.describe;

export const beforeEach = (fn: TestFunction): void => mocha.beforeEach(runInWorld(fn, "beforeEach"));
export const afterEach = (fn: TestFunction): void => mocha.afterEach(runInWorld(fn, "afterEach"));

export const it: ItFunction = Object.assign(
  (title: string, fn?: TestFunction) => mocha.it(title, fn ? runInWorld(fn, `it(${JSON.stringify(title)})`): fn),
  {
    only: (title: string, fn: TestFunction) => mocha.it.only(title, runInWorld(fn, `it(${JSON.stringify(title)})`)),
    skip: (title: string, fn: TestFunction) => mocha.it.skip(title, runInWorld(fn, `it(${JSON.stringify(title)})`)),
  }
);

export function captureError(op: Operation<any>): Operation<Error> {
  return function*() {
    try {
      yield op;
    } catch(error) {
      return error as Error;
    }
    throw new Error('expected operation to throw an error, but it did not!');
  };
}
