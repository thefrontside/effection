import { describe, beforeEach, it } from 'mocha';
import * as expect from 'expect';

import { run } from '../src/index';

process.on('unhandledRejection', (reason, promise) => {
  // silence warnings in tests
});

describe('run', () => {
  describe('with promise', () => {
    it('runs a promise to completion', () => {
      let task = run(Promise.resolve(123))
      expect(task).resolves.toEqual(123);
    });

    it('rejects a failed promise', () => {
      let error = new Error('boom');
      let task = run(Promise.reject(error))
      expect(task).rejects.toEqual(error);
    });

    it('can halt a promise', async () => {
      let promise = new Promise(() => {});
      let task = run(promise);

      task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted')
    });
  });

  describe('with undefined', () => {
    it('suspends indefinitely', () => {
      let task = run(undefined);
    });
  });

  describe('with generator', () => {
    it('can compose multiple promises via generator', () => {
      function* gen() {
        let one: number = yield Promise.resolve(12);
        let two: number = yield Promise.resolve(55);
        return one + two;
      };
      let task = run(gen());
      expect(task).resolves.toEqual(67);
    });
  });

  describe('with generator function', () => {
    it('can compose multiple promises via generator', () => {
      let task = run(function*() {
        let one: number = yield Promise.resolve(12);
        let two: number = yield Promise.resolve(55);
        return one + two;
      });
      expect(task).resolves.toEqual(67);
    });

    it('rejects generator if subtask fails', () => {
      let error = new Error('boom');
      let task = run(function*() {
        let one: number = yield Promise.resolve(12);
        let two: number = yield Promise.reject(error);
        return one + two;
      });
      expect(task).rejects.toEqual(error);
    });

    it('can recover from errors', () => {
      let error = new Error('boom');
      let task = run(function*() {
        let one: number = yield Promise.resolve(12);
        let two: number;
        try {
          yield Promise.reject(error);
        } catch(e) {
          // swallow error and yield in catch block
          two = yield Promise.resolve(8);
        }
        let three: number = yield Promise.resolve(55);
        return one + two + three;
      });
      expect(task).resolves.toEqual(75);
    });

    it('can halt generator', async () => {
      let task = run(function*() {
        let one: number = yield Promise.resolve(12);
        let two: number = yield;
        return one + two;
      });

      task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted')
    });

    it('can suspend in finally block', async () => {
      let callable;
      let eventually = new Promise((resolve) => {
        callable = function*() { resolve('did run'); }
      });

      let task = run(function*() {
        try {
          yield;
        } finally {
          yield callable;
        }
      });

      task.halt();

      await expect(eventually).resolves.toEqual("did run");
    });

    it('can await halt', async () => {
      let didRun = false;

      let task = run(function*() {
        try {
          yield;
        } finally {
          yield Promise.resolve(1);
          didRun = true;
        }
      });

      await task.halt();

      expect(didRun).toEqual(true);
    });
  });

});
