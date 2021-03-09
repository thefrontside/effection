/* eslint-disable @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-explicit-any */
import * as mocha from 'mocha';
import { run, Task, Effection, Operation } from '@effection/core';

let world: Task | undefined;

type TestFunction = (this: mocha.Context, world: Task, scope: Task) => Generator<Operation<any>, any, any>;

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

export const describe = mocha.describe;

export function it(title: string, fn: TestFunction) {
  return mocha.it(title, async function() {
    await run((task) => fn.call(this, world!, task))
  });
}

export function beforeEach(fn: TestFunction) {
  return mocha.beforeEach(async function() {
    await run((task) => fn.call(this, world!, task))
  });
}

export function afterEach(fn: TestFunction) {
  return mocha.afterEach(async function() {
    await run((task) => fn.call(this, world!, task))
  });
}

export function captureError(op: Operation<any>): Operation<Error> {
  return function*() {
    try {
      yield op;
    } catch(error) {
      return error;
    }
    throw new Error('expected operation to throw an error, but it did not!');
  }
}
