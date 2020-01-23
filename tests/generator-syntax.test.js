/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';
import mock from 'jest-mock';

import { spawn } from '../src/index';

describe('Co-routine guarantees', () => {
  let top, inner, error;
  let finalizeTop, finalizeMiddle;

  beforeEach(() => {

    finalizeTop = mock.fn();
    finalizeMiddle = mock.fn();
    top = spawn(function* top() {
      try {
        return yield function* middle() {
          try {
            return yield (ctl => inner = ctl);
          } finally {
            finalizeMiddle();
          }
        };
      } catch (e) {
        error = e;
      } finally {
        finalizeTop();
      }
    });
  });


  it('has an id', () => {
    expect(typeof top.id).toEqual('number');
  });

  it('calls all the way through to the inner child', () => {
    expect(inner).toBeDefined();
  });

  it('allocates a bigger number to the child id', () => {
    expect(inner.context.id > top.id).toEqual(true);
  });

  it('does not invoke any callback', () => {
    expect(finalizeTop).not.toHaveBeenCalled();
    expect(finalizeMiddle).not.toHaveBeenCalled();
  });

  describe('resuming the inner child', () => {
    beforeEach(() => {
      expect(inner).toBeDefined();
      inner.resume(10);
    });

    it('completes the outer execution', () => {
      expect(top.isCompleted).toEqual(true);
      expect(top.isBlocking).toEqual(false);
    });

    it('completes the inner execution', () => {
      expect(inner.context.isCompleted).toEqual(true);
      expect(inner.context.isBlocking).toEqual(false);
    });

    it('passes values up through the stack', () => {
      expect(top.result).toEqual(10);
    });

    it('invokes all finalizers', () => {
      expect(finalizeMiddle).toHaveBeenCalled();
      expect(finalizeTop).toHaveBeenCalled();
    });
  });

  describe('throwing an error into the inner child', () => {
    let err;
    beforeEach(() => {
      expect(inner).toBeDefined();
      inner.fail(err = new Error('boom!'));
    });

    it('errors out the inner execution', () => {
      expect(inner.context.isErrored).toEqual(true);
      expect(inner.context.isBlocking).toEqual(false);
    });

    it('completes the outer execution', () => {
      expect(error).toEqual(err);
      expect(top.isCompleted).toEqual(true);
      expect(top.isBlocking).toEqual(false);
    });

    it('invokes all finalizers', () => {
      expect(finalizeTop).toHaveBeenCalled();
      expect(finalizeMiddle).toHaveBeenCalled();
    });
  });

  describe('halting the inner child', () => {
    beforeEach(() => {
      expect(inner).toBeDefined();
      inner.context.halt('kill it with fire');
    });

    it('halts the inner child', () => {
      expect(inner.context.isHalted).toEqual(true);
    });

    it('errors out the parents that depended on it', () => {
      expect(top.isCompleted).toEqual(true);
      expect(error.message).toMatch(/kill it with fire/);
    });
  });

  describe('halting the outer execution', () => {
    beforeEach(() => {
      top.halt('shut it down');
    });

    it('halts the inner most child', () => {
      expect(inner.context.isHalted).toEqual(true);
      expect(inner.context.result).toEqual('shut it down');
    });
  });

});

describe('deeply nested task that throws an error', () => {
  let execution, error;
  beforeEach(() => {
    execution = spawn(function*() {
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

describe('executing a generators', () => {
  let execution;
  function* add(a, b) {
    return a + b;
  }

  describe('nested inside generator functions', () => {
    beforeEach(() => {

      execution = spawn(function*() {
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
      execution = spawn(add(1, 2));
    });
    it('computes the result just fine', () => {
      expect(execution.isCompleted).toEqual(true);
      expect(execution.result).toEqual(3);
    });
  });
});
