import { Context, Operation, run as effectionRun } from 'effection';
import { performance } from 'perf_hooks';

type World = Context & { spawn<T>(operation: Operation<T>): Promise<T> };

let currentWorld: World;
let mochaTimeout: number;

before(function() {
  mochaTimeout = this.timeout(50).timeout();
});

beforeEach(() => {
  currentWorld = effectionRun(undefined) as World;
});

afterEach(() => {
  currentWorld.halt();
});

export function run<T>(operation: Operation<T>): Promise<T> {
  return currentWorld.spawn(operation);
}
export async function when<T>(fn: () => T, timeout = mochaTimeout): Promise<T> {
  let startTime = performance.now();

  while (true) {
    try {
      return fn();
    } catch (err) {
      let diff = performance.now() - startTime;
      if (diff > timeout) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
}

export async function never(fn: () => void, timeout = mochaTimeout): Promise<void> {
  let startTime = performance.now();
  let passed = false;

  while (true) {
    try {
      fn();
      passed = true;
    } catch (err) {
      let diff = performance.now() - startTime;
      if (diff > timeout) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    if (passed === true) {
      throw new Error(`${fn} passed unexpectedly`);
    }
  }
}
