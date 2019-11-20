/* global describe, beforeEach, it */

import expect from 'expect';

import { fork } from '../src/index';
import mock from 'jest-mock';

describe('Controlling execution', () => {
  let execution, controller, relinquish;

  function control(ctl) {
    controller = ctl;
    return relinquish;
  }

  beforeEach(() => {
    execution = controller = relinquish = undefined;
  });

  describe('from the last step in an execption', () => {
    beforeEach(() => {
      relinquish = mock.fn();

      execution = fork(function*() {
        yield control;
      });

      expect(controller).toBeDefined();
    });

    it('does not call the relinquish upon entering the control context', () => {
      expect(relinquish).not.toHaveBeenCalled();
    });

    describe('resuming execution', () => {
      beforeEach(() => {
        controller.resume();
      });
      it('invokes the release function', () => {
        expect(relinquish).toHaveBeenCalled();
      });
    });

    describe('erroring execution', () => {
      beforeEach(() => {
        controller.throw(new Error('boom!'));
        expect(execution.isErrored).toEqual(true);
        expect(execution.result.message).toEqual('boom!');
      });

      it('invokes the release function', () => {
        expect(relinquish).toHaveBeenCalled();
      });
    });

    describe('halting the top level execution', () => {
      beforeEach(() => {
        execution.halt();
      });

      it('still invokes the controller relinquish', () => {
        expect(relinquish).toHaveBeenCalled();
      });
    });
  });


  describe('from an intermediate step in an execution', () => {
    beforeEach(() => {
      relinquish = mock.fn();
      fork(function* () {
        yield control;
        yield ctl => ctl.resume();
      });
      expect(controller).toBeDefined();
      controller.resume();
    });

    it('still invokes the relinquish function', () => {
      expect(relinquish).toHaveBeenCalled();
    });
  });

  describe('a release function that throws an error', () => {
    beforeEach(() => {
      relinquish = () => { throw new Error('this is a bug in the release control!'); };
      fork(function* () {
        yield control;
      });
    });

    it('throws that error when trying to resume execution', () => {
      expect(() => controller.resume()).toThrow(/this is a bug/);
    });
  });
});
