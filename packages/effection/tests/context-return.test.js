/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';

import { run, fork, spawn } from '../src/index';

describe('Returning an execution context', () => {
  let execution, one, two, inner;

  describe('with a regular return', () => {
    beforeEach(() => {
      execution = run(function* outer() {
        one = yield function*() {
          inner = yield spawn();
          return inner;
        };
        two = yield fork();
      });
    });

    it('does not affect the state of the parent context', () => {
      expect(execution.state).toEqual("waiting");
      expect(two.state).toEqual("running");
    });

    it('does not halt the returned execution context when exiting the scope', () => {
      expect(inner.state).toEqual("running");
    });

    it('resolves to the returned context', () => {
      expect(one).toEqual(inner);
    });

    describe('halting the context into which it was returned', () => {
      beforeEach(() => {
        execution.halt();
      });

      it('also halts the returned context', () => {
        expect(inner.state).toEqual("halted");
      });
    });
  });

  describe('with a top level return', () => {
    beforeEach(() => {
      execution = run(function* outer() {
        inner = yield fork();
        return inner;
      });
    });

    it('keeps the top scope blocking', () => {
      expect(execution.isBlocking).toEqual(true);
    });

    it('does not halt the returned execution context when exiting the scope', () => {
      expect(inner.state).toEqual("running");
    });

    describe('halting the top scope', () => {
      beforeEach(() => {
        execution.halt();
      });

      it('also halts the returned context', () => {
        expect(inner.state).toEqual("halted");
      });
    });
  });
});
