/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';
import mock from 'jest-mock';

import { fork } from '../src/index';

describe('Exec', () => {
  describe('deeply nested task', () => {
    let inner, execution, error;
    let onSuccess, onError, onFinally;
    beforeEach(() => {
      onSuccess = mock.fn(x => x);
      onError = mock.fn(x => x);
      onFinally = mock.fn(x => x);
      execution = fork(function*() {
        try {
          return yield function*() {
            return yield function*() {
              return yield ctl => inner = ctl;
            };
          };
        } catch (e) {
          error = e;
        }
      });
    });

    it('has an id', () => {
      expect(typeof execution.id).toEqual('number');
    });

    it('calls all the way through to the inner child', () => {
      expect(inner).toBeDefined();
    });

    it('allocates a bigger number to the child id', () => {
      expect(inner.id > execution.id).toEqual(true);
    });

    it('does not invoke any callback', () => {
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(onFinally).not.toHaveBeenCalled();
    });

    describe('resuming the inner child', () => {
      beforeEach(() => {
        expect(inner).toBeDefined();
        inner.resume(10);
      });

      it('completes the outer execution', () => {
        expect(execution.isCompleted).toEqual(true);
        expect(execution.isBlocking).toEqual(false);
      });

      it('completes the inner execution', () => {
        expect(inner.isCompleted).toEqual(true);
        expect(inner.isBlocking).toEqual(false);
      });

      it('passes values up through the stack', () => {
        expect(execution.result).toEqual(10);
      });
    });

    describe('throwing an error into the inner child', () => {
      let err;
      beforeEach(() => {
        expect(inner).toBeDefined();
        inner.throw(err = new Error('boom!'));
      });

      it('errors out the inner execution', () => {
        expect(inner.isErrored).toEqual(true);
        expect(inner.isBlocking).toEqual(false);
      });

      it('completes the outer execution', () => {
        expect(error).toEqual(err);
        expect(execution.isCompleted).toEqual(true);
        expect(execution.isBlocking).toEqual(false);
      });
    });

    describe('halting the inner child', () => {
      beforeEach(() => {
        expect(inner).toBeDefined();
        inner.halt('kill it with fire');
      });

      it('halts the inner child', () => {
        expect(inner.isHalted).toEqual(true);
      });

      it('errors out the parents that depended on it', () => {
        expect(execution.isCompleted).toEqual(true);
        expect(error.message).toMatch(/kill it with fire/);
      });
    });

    describe('halting the outer execution', () => {
      beforeEach(() => {
        execution.halt('shut it down');
      });

      it('halts the inner most child', () => {
        expect(inner.isHalted).toEqual(true);
        expect(inner.result).toEqual('shut it down');
      });
    });

  });

  describe('deeply nested task that throws an error', () => {
    let execution, error;
    beforeEach(() => {
      execution = fork(function*() {
        try {
          return yield function*() {
            return yield function*() {
              throw new Error('boom!');
            };
          };
        } catch (e) {
          error = e;
        }
      });
    });
    it('throws the error all the way up to the top', () => {
      expect(error.message).toEqual('boom!');
    });

    it('completes the execution', () => {
      expect(execution.isCompleted).toEqual(true);
    });
  });

  describe('An execution with an empty yield', () => {
    let execution, error;

    beforeEach(() => {
      execution = fork(function*() {
        return yield;
      });
    });

    it('is running while yielded', () => {
      expect(execution.isRunning).toEqual(true);
    });

    describe('resuming the execution externally', () => {
      beforeEach(() => {
        execution.resume(10);
      });

      it('completes', async () => {
        expect(execution.state).toEqual('completed');
        expect(execution.result).toEqual(10);
        await expect(execution).resolves.toBe(10);
      });
    });

    describe('erroring the execution externally', () => {
      beforeEach(() => {
        execution.throw(new Error('boom'));
      });

      it('errors', async () => {
        expect(execution.state).toEqual('errored');
        expect(execution.result.message).toEqual('boom');
        await expect(execution).rejects.toThrow('boom');
      });
    });
  });

  describe('executing a generators', () => {
    let execution;
    function* add(a, b) {
      return a + b;
    }

    describe('nested inside generator functions', () => {
      beforeEach(() => {

        execution = fork(function*() {
          let one = yield function*() { return 1; };
          let two = yield function*() { return 2; };
          return yield add(one, two);
        });
      });

      it('computes the result just fine', () => {
        expect(execution.isCompleted).toEqual(true);
        expect(execution.result).toEqual(3);
      });
    });

    describe('directly', () => {
      beforeEach(() => {
        execution = fork(add(1, 2));
      });
      it('computes the result just fine', () => {
        expect(execution.isCompleted).toEqual(true);
        expect(execution.result).toEqual(3);
      });
    });
  });
});
