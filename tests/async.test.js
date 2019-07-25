/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';

import { execute } from '../src/index';

describe('Async executon', () => {
  describe('with asynchronously executing children', () => {
    let execution, one, two, three;

    beforeEach(() => {
      execution = execute(function() {
        this.fork(function*() {
          yield cxt => one = cxt;
        });

        this.fork(function*() {
          yield cxt => two = cxt;
        });

        this.fork(function*() {
          yield cxt => three = cxt;
        });
      });
    });
    it('begins execution of each child immediately', () => {
      expect(one).toBeDefined();
      expect(two).toBeDefined();
      expect(three).toBeDefined();
    });

    it('consideres the execution to be completed, but waiting and blocking', () => {
      expect(execution.isWaiting).toEqual(true);
      expect(execution.isBlocking).toEqual(true);
    });

    describe('finishing two of the children', () => {
      beforeEach(() => {
        one.resume();
        two.resume();
      });

      it('considers them complete and non blocking', () => {
        expect(one.isCompleted).toEqual(true);
        expect(one.isBlocking).toEqual(false);

        expect(two.isCompleted).toEqual(true);
        expect(two.isBlocking).toEqual(false);
      });

      it('still considers the third child as running', () => {
        expect(three.isRunning).toEqual(true);
      });

      it('considers the top level execution to still be waiting', () => {
        expect(execution.isWaiting).toEqual(true);
      });

      describe('finishing the third and final child', () => {
        beforeEach(() => {
          three.resume();
        });
        it('considers the entire task no longer waiting', () => {
          expect(execution.isWaiting).toEqual(false);
          expect(execution.isBlocking).toEqual(false);
        });
      });
    });

    describe('halting the top level context', () => {
      beforeEach(() => {
        execution.halt();
      });

      it('halts all of the children', () => {
        expect(one.isHalted).toEqual(true);
        expect(two.isHalted).toEqual(true);
        expect(three.isHalted).toEqual(true);
      });
    });


    describe('halting one of the children', () => {
      beforeEach(() => {
        two.halt();
      });
      it('does not cancel anything else', () => {
        expect(execution.isWaiting).toEqual(true);
        expect(one.isRunning).toEqual(true);
        expect(three.isRunning).toEqual(true);
      });
    });

    describe('halting all of the children', () => {
      beforeEach(() => {
        one.halt();
        two.halt();
        three.halt();
      });

      it('completes the top-level execution', () => {
        expect(execution.isCompleted).toEqual(true);
      });
    });

    describe('throwing an error in one of the children', () => {
      let error, boom;
      beforeEach(() => {
        boom = new Error('boom!');
        execution.catch(e => error = e);
        one.throw(boom);
      });

      it('errors out the parent', () => {
        expect(execution.isErrored).toEqual(true);
        expect(error).toEqual(boom);
      });

      it('has the error as its result', () => {
        expect(execution.result).toEqual(boom);
      });
    });

  });

  describe('with a mixture of synchronous and asynchronous executions', () => {
    let execution, one, two, sync, boom, error;
    beforeEach(() => {
      error = undefined;
      boom = new Error('boom!');
      execution = execute(function*() {
        this.fork(function*() { yield cxt => one = cxt; });
        this.fork(function*() { yield cxt => two = cxt; });
        yield function*() {
          yield cxt => sync = cxt;
        };
      }).catch(e => error = e);
      expect(one).toBeDefined();
      expect(two).toBeDefined();
      expect(sync).toBeDefined();
    });

    describe('finishing the synchronous execution', () => {
      beforeEach(() => {
        sync.resume();
      });

      it('is still waiting on the async execution', () => {
        expect(execution.isWaiting).toEqual(true);
      });

      describe('when the async portions complet', () => {
        beforeEach(() => {
          one.resume();
          two.resume();
        });
        it('makes the whole execution complete', () => {
          expect(execution.isCompleted).toEqual(true);
        });
      });
    });

    describe('finishing the async portion', () => {
      beforeEach(() => {
        one.resume();
        two.resume();
      });

      it('is still running as it waits on the sync portion', () => {
        expect(execution.isRunning).toEqual(true);
      });

      describe('. When the sync portion finally completes', () => {
        beforeEach(() => {
          sync.resume();
        });
        it('is a complete execution', () => {
          expect(execution.isCompleted).toEqual(true);
        });
      });
    });

    describe('halting the async portion', () => {
      beforeEach(() => {
        one.halt();
        two.halt();
      });

      it('is still running as it waits on the sync portion', () => {
        expect(execution.isRunning).toEqual(true);
      });

      describe('then finishing the sync portion', () => {
        beforeEach(() => {
          sync.resume();
        });
        it('completes the whole enchilada', () => {
          expect(execution.isCompleted).toEqual(true);
        });
      });
    });

    describe('throwing from within the synchronous task', () => {
      beforeEach(() => {
        sync.throw(boom);
      });

      it('errors out the top level execution', () => {
        expect(execution.isErrored).toEqual(true);
        expect(error).toEqual(boom);
      });

      it('halts the async children', () => {
        expect(one.isHalted).toEqual(true);
        expect(two.isHalted).toEqual(true);
      });
    });

    describe('throwing from within one of the async tasks', () => {
      beforeEach(() => {
        one.throw(boom);
      });

      it('errors out the top level execution', () => {
        expect(execution.isErrored).toEqual(true);
        expect(error).toEqual(boom);
      });

      it('halts the async children', () => {
        expect(two.isHalted).toEqual(true);
        expect(sync.isHalted).toEqual(true);
      });
    });

    describe('halting the top level execution', () => {
      beforeEach(() => {
        execution.halt();
      });

      it('does not throw an error', () => {
        expect(error).toBeUndefined();
      });

      it('halts the execution, and all its children', () => {
        expect(execution.isHalted).toEqual(true);
        expect(one.isHalted).toEqual(true);
        expect(two.isHalted).toEqual(true);
        expect(sync.isHalted).toEqual(true);
      });
    });
  });

  describe('A parent that block, but also has an async child', () => {
    let parent, child;
    beforeEach(() => {
      parent = execute(function*() {
        this.fork(function*() { yield cxt => child = cxt; });
        yield x => x;
      });
    });

    it('starts out as running', () => {
      expect(parent.isRunning).toEqual(true);
    });

    describe('when the async child finishes', () => {
      beforeEach(() => {
        child.resume();
      });

      it('keeps the parent running because it is still yielding on its own', () => {
        expect(parent.isRunning).toEqual(true);
      });
    });
  });


  describe('the fork function', () => {
    let a,b;
    let forkReturn, forkContext;
    beforeEach(() => {
      execute(function*() {
        forkReturn = this.fork(function*(x, y) {
          forkContext = this;
          a = x;
          b = y;
        }, [1,2]);
      });
    });

    it('passes the arguments array as positional arguments to its generator', () => {
      expect(a).toEqual(1);
      expect(b).toEqual(2);
    });

    it('returns the forked child', () => {
      expect(forkReturn).toBeDefined();
      expect(forkReturn).toEqual(forkContext);
    });
  });

});
