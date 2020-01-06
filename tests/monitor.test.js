/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';

import { fork, monitor } from '../src/index';

describe('monitor', () => {
  describe('creates a monitor which does not prevent execution from finishing', () => {
    let execution, one, two;

    beforeEach(() => {
      execution = fork(function() {
        monitor(function*() {
          yield cxt => one = cxt;
        });

        fork(function*() {
          yield cxt => two = cxt;
        });
      });
    });

    describe('finishing forks', () => {
      beforeEach(() => {
        two.resume();
      });

      it('shuts down the monitor', () => {
        expect(one.isHalted).toEqual(true);
        expect(one.isBlocking).toEqual(false);

        expect(two.isCompleted).toEqual(true);
        expect(two.isBlocking).toEqual(false);
      });

      it('completes the top level exectution', () => {
        expect(execution.isCompleted).toEqual(true);
      });
    });

    describe('halting the top level context', () => {
      beforeEach(() => {
        execution.halt();
      });

      it('halts the monitor', () => {
        expect(one.isHalted).toEqual(true);
        expect(two.isHalted).toEqual(true);
      });
    });

    describe('halting the monitor', () => {
      beforeEach(() => {
        one.halt();
      });
      it('does not cancel anything else', () => {
        expect(execution.isWaiting).toEqual(true);
        expect(two.isRunning).toEqual(true);
      });
    });

    describe('throwing an error in the monitor', () => {
      let boom;
      beforeEach(() => {
        boom = new Error('boom!');
        one.throw(boom);
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
});
