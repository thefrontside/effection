import { performance } from 'perf_hooks';
import { Effection } from '@effection/core';

let mochaTimeout: number;

before(function() {
  mochaTimeout = this.timeout(50).timeout();
});

beforeEach(async () => {
  await Effection.reset();
});

afterEach(async () => {
  await Effection.root.halt();
});

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
