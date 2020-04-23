/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';

import { main, fork, contextOf, resource } from '../src/index';

describe('Returning resources', () => {
  let execution, one, two, object, value, resume;

  describe('with regular resource', () => {
    beforeEach(() => {
      execution = main(function* outer() {
        one = yield function* one() {
          object = { hello: "world" };
          return yield resource(object, function* resource() {
            yield (ctl) => resume = ctl.resume;
            value = 123;
          });
        };
        two = yield fork();
      });
    });

    it('does not affect the state of the parent context', () => {
      expect(execution.state).toEqual("waiting");
      expect(two.state).toEqual("running");
    });

    it('does not halt the returned resource when exiting the scope', () => {
      expect(contextOf(object).state).toEqual("running");
    });

    it('resolves to the returned object', () => {
      expect(one).toEqual(object);
    });

    describe('halting the context into which it was returned', () => {
      beforeEach(() => {
        execution.halt();
      });

      it('also halts the returned resource', () => {
        expect(contextOf(object).state).toEqual("halted");
      });
    });

    describe('resuming the resource', () => {
      beforeEach(() => {
        resume();
      });

      it('completes the resource', () => {
        expect(contextOf(object).state).toEqual("completed");
        expect(value).toEqual(123);
      });
    });
  });

  describe('with context returning resource', () => {
    beforeEach(() => {
      execution = main(function* outer() {
        one = yield function* one() {
          object = { hello: "world" };
          return yield resource(object, function* resource() {
            return yield fork((ctl) => {
              resume = ctl.resume;
            });
          });
        };
        two = yield fork();
      });
    });

    it('does not affect the state of the parent context', () => {
      expect(execution.state).toEqual("waiting");
      expect(two.state).toEqual("running");
    });

    it('does not halt the returned resource when exiting the scope', () => {
      expect(contextOf(object).state).toEqual("waiting");
    });

    it('resolves to the returned object', () => {
      expect(one).toEqual(object);
    });

    describe('halting the context into which it was returned', () => {
      beforeEach(() => {
        execution.halt();
      });

      it('also halts the returned resource', () => {
        expect(contextOf(object).state).toEqual("halted");
      });
    });

    describe('resuming the resource', () => {
      beforeEach(() => {
        resume();
      });

      it('completes the resource', () => {
        expect(contextOf(object).state).toEqual("completed");
        expect(value).toEqual(123);
      });
    });
  });

  describe('null operations', () => {
    beforeEach(() => {
      return execution = main(function*() {
        yield Promise.resolve(null);
      });
    });
    it('completes', () => {
      expect(execution.state).toEqual('completed');
    });
  });

});
