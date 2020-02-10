/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';

import { main, fork, join } from '../src/index';

describe('Async executon', () => {
  describe('with asynchronously executing children', () => {
    let execution, one, two, three;

    beforeEach(() => {
      execution = main(function* outer() {
        one = yield fork();

        two = yield fork();

        three = yield fork();
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
      let boom;
      beforeEach(() => {
        boom = new Error('boom!');
        one.fail(boom);
      });

      it('errors out the parent', () => {
        expect(execution.isErrored).toEqual(true);
        expect(execution.result).toEqual(boom);
      });

      it('has the error as its result', () => {
        expect(execution.result).toEqual(boom);
      });
    });

  });

  describe('with a mixture of synchronous and asynchronous executions', () => {
    let execution, one, two, three, sync, boom;
    beforeEach(() => {
      boom = new Error('boom!');
      execution = main(function*() {
        one = yield fork();
        two = yield fork();
        yield function*() {
          yield ({ context, ...control }) => {
            sync = control;
            three = context;
          };
        };
      });
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
        sync.fail(boom);
      });

      it('errors out the top level execution', () => {
        expect(execution.isErrored).toEqual(true);
        expect(execution.result).toEqual(boom);
      });

      it('halts the async children', () => {
        expect(one.isHalted).toEqual(true);
        expect(two.isHalted).toEqual(true);
      });
    });

    describe('throwing from within one of the async tasks', () => {
      beforeEach(() => {
        one.fail(boom);
      });

      it('errors out the top level execution', () => {
        expect(execution.isErrored).toEqual(true);
        expect(execution.result).toEqual(boom);
      });

      it('halts the async children', () => {
        expect(two.isHalted).toEqual(true);
        expect(three.isHalted).toEqual(true);
      });
    });

    describe('halting the top level execution', () => {
      beforeEach(() => {
        execution.halt();
      });

      it('does not throw an error', () => {
        expect(execution.result).toBeUndefined();
      });

      it('halts the execution, and all its children', () => {
        expect(execution.isHalted).toEqual(true);
        expect(one.isHalted).toEqual(true);
        expect(two.isHalted).toEqual(true);
        expect(three.isHalted).toEqual(true);
      });
    });
  });

  describe('A parent that block, but also has an async child', () => {
    let parent, child;
    beforeEach(() => {
      parent = main(function*() {
        child = yield fork();
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

    describe('when the async child is halted', () => {
      beforeEach(() => {
        child.halt();
      });
      it('keeps the parent running because it is still yielding on its own', () => {
        expect(parent.isRunning).toEqual(true);
      });
      it('removes the child from the list of children', () => {
        expect(parent.children.has(child)).toEqual(false);
      });
    });
  });

  describe('joining a fork', () => {
    let root, child, getNumber;
    beforeEach(() => {
      root = main(function*() {
        child = yield fork(function*() {
          getNumber = yield fork();
          let number = yield join(getNumber);
          return number * 2;
        });
        let value = yield join(child);
        return value + 1;
      });
    });

    describe('when the child resumes', () => {
      beforeEach(() => {
        getNumber.resume(5);
      });

      it('awaits the value from the child', () => {
        expect(root.result).toBe(11);
      });

    });

    describe('when the child fails', () => {
      beforeEach(() => {
        getNumber.fail(new Error("boom!"));

      });

      it('throws if child is thrown', () => {
        expect(root.result.message).toEqual('boom!');
      });
    });

    describe('when the child halts', () => {
      beforeEach(() => {
        getNumber.halt();
      });

      it('throws if child is halted', () => {
        expect(root.result.message).toMatch("Interrupt");
      });
    });
  });

  describe('a parent halting a child', () => {
    let root, wait;

    beforeEach(() => {
      root = main(function* root() {
        let child = yield fork();

        try {
          return yield cxt => wait = cxt;
        } finally {
          child.halt();
        }
      });

      wait.resume(5);
    });

    it('returns its own result result', () => {
      expect(root.result).toEqual(5);
    });
  });

});
