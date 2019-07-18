/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';
import mock from 'jest-mock';

import { execute } from '../src/index';

describe('Exec', () => {
  describe('deeply nested task', () => {
    let inner, execution, error;
    let onSuccess, onError, onFinally;
    beforeEach(() => {
      onSuccess = mock.fn(x => x);
      onError = mock.fn(x => x);
      onFinally = mock.fn(x => x);
      execution = execute(function*() {
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

    it('calls all the way through to the inner child', () => {
      expect(inner).toBeDefined();
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
      execution = execute(function*() {
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

  describe('callbacks', () => {
    let execution, inner;

    let onSuccess, onError, onFinally;

    let id = x => x;

    beforeEach(() => {
      execution = execute(function*() {
        return yield function*() {
          return yield function*() {
            return yield function*() {
              return yield exec => inner = exec;
            };
          };
        };
      }).then(onSuccess = mock.fn(id))
        .catch(onError = mock.fn(id))
        .finally(onFinally = mock.fn(id));

      expect(inner).toBeDefined();
    });

    it('does not invoke any of the callbacks', () => {
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(onFinally).not.toHaveBeenCalled();
    });

    describe('completing the innermost execution', () => {
      beforeEach(() => {
        inner.resume(10);
      });

      it('calls the success callback, and the finally callback, but not the error callback', () => {
        expect(onSuccess).toHaveBeenCalledWith(execution);
        expect(onError).not.toHaveBeenCalled();
        expect(onFinally).toHaveBeenCalledWith(execution);
      });
    });

    describe('throwing an error from within the inner-most execution', () => {
      beforeEach(() => {
        inner.throw(new Error('boom!'));
      });

      it('calls the error callback, and the finally callback, but not the success callback', () => {
        expect(onError).toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFinally).toHaveBeenCalledWith(execution);
      });
    });
  });

  describe('An execution with an empty yield', () => {
    let execution, error;

    beforeEach(() => {
      execution = execute(function*() {
        return yield;
      }).catch(e => error = e);
    });

    it('is running while yielded', () => {
      expect(execution.isRunning).toEqual(true);
    });

    describe('resuming the execution externally', () => {
      beforeEach(() => {
        execution.resume(10);
      });

      it('completes', () => {
        expect(execution.result).toEqual(10);
      });
    });

    describe('erroring the execution externally', () => {
      beforeEach(() => {
        execution.throw(new Error('boom'));
      });

      it('errors', () => {
        expect(error).toBeDefined();
        expect(error.message).toEqual('boom');
      });
    });
  });
});
