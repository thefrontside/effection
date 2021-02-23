import { describe, beforeEach, it } from 'mocha';
import * as expect from 'expect';

import { run, sleep, Operation, Task } from '../src/index';
import { Deferred } from '../src/deferred';

function createNumber(value: number) {
  return function*() {
    yield sleep(1);
    return value;
  }
}

function *blowUp() {
  yield sleep(1);
  throw new Error('boom');
}

describe('run', () => {
  describe('with promise', () => {
    it('runs a promise to completion', async () => {
      let task = run(Promise.resolve(123))
      await expect(task).resolves.toEqual(123);
      expect(task.state).toEqual('completed');
      expect(task.result).toEqual(123);
    });

    it('rejects a failed promise', async () => {
      let error = new Error('boom');
      let task = run(Promise.reject(error))
      await expect(task).rejects.toEqual(error);
      expect(task.state).toEqual('errored');
      expect(task.error).toEqual(error);
    });

    it('can halt a promise', async () => {
      let promise = new Promise(() => {});
      let task = run(promise);

      task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted')
      expect(task.state).toEqual('halted');
      expect(task.result).toEqual(undefined);
    });
  });

  describe('with undefined', () => {
    it('suspends indefinitely', async () => {
      let task = run();

      await run(sleep(10));

      expect(task.state).toEqual('running');
    });

    it('can be halted', async () => {
      let task = run();

      await task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted')
      expect(task.state).toEqual('halted');
      expect(task.result).toEqual(undefined);
    });
  });

  describe('with resolution function', () => {
    it('resolves when resolve is called', async () => {
      let task = run(() => {
        return (resolve, reject) => {
          setTimeout(() => resolve(123), 5)
        }
      });
      await expect(task).resolves.toEqual(123);
      expect(task.state).toEqual('completed');
      expect(task.result).toEqual(123);
    });

    it('rejects when reject is called', async () => {
      let task = run(() => {
        return (resolve, reject) => {
          setTimeout(() => reject(new Error('boom')), 5)
        }
      });
      await expect(task).rejects.toHaveProperty('message', 'boom');
      expect(task.state).toEqual('errored');
      expect(task.error).toHaveProperty('message', 'boom');
    });

    it('rejects when error is thrown in function', async () => {
      let task = run(() => {
        return (resolve, reject) => {
          throw new Error('boom');
        }
      });
      await expect(task).rejects.toHaveProperty('message', 'boom');
      expect(task.state).toEqual('errored');
      expect(task.error).toHaveProperty('message', 'boom');
    });

    it('can be halted', async () => {
      let task = run(() => {
        return (resolve, reject) => {
        }
      });

      await task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted')
      expect(task.state).toEqual('halted');
      expect(task.result).toEqual(undefined);
    });
  });

  describe('with promise function', () => {
    it('runs a promise to completion', async () => {
      let task = run((task) => Promise.resolve(123))
      await expect(task).resolves.toEqual(123);
      expect(task.state).toEqual('completed');
      expect(task.result).toEqual(123);
    });

    it('rejects a failed promise', async () => {
      let error = new Error('boom');
      let task = run((task) => Promise.reject(error))
      await expect(task).rejects.toEqual(error);
      expect(task.state).toEqual('errored');
      expect(task.error).toEqual(error);
    });

    it('can halt a promise', async () => {
      let promise = new Promise(() => {});
      let task = run((task) => promise);

      task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted')
      expect(task.state).toEqual('halted');
      expect(task.result).toEqual(undefined);
    });
  });

  describe('with generator function', () => {
    it('can compose multiple promises via generator', async () => {
      let task = run(function*() {
        let one: number = yield Promise.resolve(12);
        let two: number = yield Promise.resolve(55);
        return one + two;
      });
      await expect(task).resolves.toEqual(67);
      expect(task.state).toEqual('completed');
      expect(task.result).toEqual(67);
    });

    it('can compose operations', async () => {
      let task = run(function*() {
        let one: number = yield createNumber(12);
        let two: number = yield createNumber(55);
        return one + two;
      });
      await expect(task).resolves.toEqual(67);
      expect(task.state).toEqual('completed');
      expect(task.result).toEqual(67);
    });

    it('rejects generator if subtask promise fails', async () => {
      let error = new Error('boom');
      let task = run(function*() {
        let one: number = yield createNumber(12);
        let two: number = yield blowUp;
        return one + two;
      });
      await expect(task).rejects.toEqual(error);
      expect(task.state).toEqual('errored');
      expect(task.error).toEqual(error);
    });

    it('rejects generator if generator creation fails', async () => {
      let task = run(function(task) {
        throw new Error('boom');
      });
      await expect(task).rejects.toHaveProperty('message', 'boom');
      expect(task.state).toEqual('errored');
      expect(task.error).toHaveProperty('message', 'boom');
    });

    it('rejects generator if subtask operation fails', async () => {
      let task = run(function*() {
        let one: number = yield createNumber(12);
        let two: number = yield blowUp;
        return one + two;
      });
      await expect(task).rejects.toHaveProperty('message', 'boom');
      expect(task.state).toEqual('errored');
      expect(task.error).toHaveProperty('message', 'boom');
    });

    it('can recover from errors in promise', async () => {
      let error = new Error('boom');
      let task = run(function*() {
        let one: number = yield Promise.resolve(12);
        let two: number;
        try {
          yield Promise.reject(error);
          two = 9;
        } catch(e) {
          // swallow error and yield in catch block
          two = yield Promise.resolve(8);
        }
        let three: number = yield Promise.resolve(55);
        return one + two + three;
      });
      await expect(task).resolves.toEqual(75);
      expect(task.state).toEqual('completed');
      expect(task.result).toEqual(75);
    });

    it('can recover from errors in operation', async () => {
      let task = run(function*() {
        let one: number = yield Promise.resolve(12);
        let two: number;
        try {
          yield blowUp;
          two = 9;
        } catch(e) {
          // swallow error and yield in catch block
          two = yield Promise.resolve(8);
        }
        let three: number = yield Promise.resolve(55);
        return one + two + three;
      });
      await expect(task).resolves.toEqual(75);
      expect(task.state).toEqual('completed');
      expect(task.result).toEqual(75);
    });

    it('can halt generator', async () => {
      let task = run(function*() {
        let one: number = yield Promise.resolve(12);
        let two: number = yield;
        return one + two;
      });

      task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted')
      expect(task.state).toEqual('halted');
      expect(task.result).toEqual(undefined);
    });

    it('halts task when halted generator', async () => {
      let child: Task | undefined;
      let task = run(function*() {
        yield function*(task) {
          child = task;
          yield sleep(100);
        }
      });

      task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted')
      await expect(child).rejects.toHaveProperty('message', 'halted')
      expect(task.state).toEqual('halted');
      expect(task.result).toEqual(undefined);
      expect(child && child.state).toEqual('halted');
      expect(child && child.result).toEqual(undefined);
    });

    it('can suspend in finally block', async () => {
      let eventually = Deferred();

      let task = run(function*() {
        try {
          yield;
        } finally {
          yield sleep(10);
          eventually.resolve(123);
        }
      });

      task.halt();

      await expect(eventually.promise).resolves.toEqual(123);
      expect(task.state).toEqual('halted');
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
      expect(task.state).toEqual('halted');
    });
  });

  describe('with promise function', () => {
    it('runs a promise to completion', async () => {
      let task = run((task) => Promise.resolve(123))
      await expect(task).resolves.toEqual(123);
      expect(task.state).toEqual('completed');
      expect(task.result).toEqual(123);
    });

    it('rejects a failed promise', async () => {
      let error = new Error('boom');
      let task = run((task) => Promise.reject(error))
      await expect(task).rejects.toEqual(error);
      expect(task.state).toEqual('errored');
      expect(task.error).toEqual(error);
    });

    it('can halt a promise', async () => {
      let promise = new Promise(() => {});
      let task = run((task) => promise);

      task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted')
      expect(task.state).toEqual('halted');
      expect(task.result).toEqual(undefined);
    });
  });
});
