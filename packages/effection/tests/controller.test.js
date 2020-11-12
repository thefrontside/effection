/* global describe, beforeEach, it */

import expect from 'expect';

import { run } from '../src/index';

import mock from 'jest-mock';

describe('Controlling execution', () => {
  let execution, resume, fail, relinquish;

  function control(controller) {
    ({ resume, fail } = controller);
    controller.ensure(relinquish);
  }

  beforeEach(() => {
    execution = resume = fail = relinquish = undefined;
  });

  describe('from the last step in an execption', () => {
    beforeEach(() => {
      relinquish = mock.fn();

      execution = run(function*() {
        yield control;
      });

      expect(resume).toBeDefined();
      expect(fail).toBeDefined();
    });

    it('does not call the relinquish upon spawning the control context', () => {
      expect(relinquish).not.toHaveBeenCalled();
    });

    describe('resuming execution', () => {
      beforeEach(() => {
        resume();
      });
      it('invokes the release function', () => {
        expect(relinquish).toHaveBeenCalled();
      });
    });

    describe('erroring execution', () => {
      beforeEach(() => {
        fail(new Error('boom!'));
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
      run(function* () {
        yield control;
        yield ctl => ctl.resume();
      });
      expect(resume).toBeDefined();
      resume();
    });

    it('still invokes the relinquish function', () => {
      expect(relinquish).toHaveBeenCalled();
    });
  });
});
