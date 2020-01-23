/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';

import { main, fork, monitor } from '../src/index';

describe('monitor', () => {
  describe('creates a monitor which does not prevent execution from finishing', () => {
    let execution, one, two;

    beforeEach(() => {
      execution = main(function*() {
        yield monitor(ctl => one = ctl);

        yield fork(ctl => two = ctl);
      });
    });

    describe('finishing forks', () => {
      beforeEach(() => {
        two.resume();
      });

      it('shuts down the monitor', () => {
        expect(one.context.isHalted).toEqual(true);
        expect(one.context.isBlocking).toEqual(false);

        expect(two.context.isCompleted).toEqual(true);
        expect(two.context.isBlocking).toEqual(false);
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
        expect(one.context.isHalted).toEqual(true);
        expect(two.context.isHalted).toEqual(true);
      });
    });

    describe('halting the monitor', () => {
      beforeEach(() => {
        one.context.halt();
      });
      it('does not cancel anything else', () => {
        expect(execution.isWaiting).toEqual(true);
        expect(two.context.isRunning).toEqual(true);
      });
    });

    describe('throwing an error in the monitor', () => {
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
});
