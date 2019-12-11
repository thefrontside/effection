import expect from 'expect';
import mock from 'jest-mock';
import { enter, join, fork } from '../src/index';

describe('execution', () => {

  describe('raw functions that resume immediately', () => {
    let exec, exit;
    beforeEach(() => {
      exit = mock.fn();
      exec = enter(({ resume, ensure }) => {
        ensure(exit);
        resume(1234);
      });
    });
    it('is completed', () => {
      expect(exec.isCompleted).toBe(true);
    });
    it('has the result that was resumed', () => {
      expect(exec.result).toEqual(1234);
    });
    it('invokes any exit handlers', () => {
      expect(exit).toHaveBeenCalled();
    });
  });
  describe('raw functions that fail immediately', () => {
    let exec, exit;
    beforeEach(() => {
      exit = mock.fn();
      exec = enter(({ fail, ensure }) => {
        ensure(exit);
        fail(new Error('boom!'));
      });
    });
    it('is errored', () => {
      expect(exec.isErrored).toEqual(true);
    });
    it('has the error as its result', () => {
      let { result } = exec;
      expect(result).toBeDefined();
      expect(result.message).toEqual('boom!');
    });
    it('invokes any exit handlers', () => {
      expect(exit).toHaveBeenCalled();
    });
  });

  describe('an operation that joins the other', () => {
    let exec, resume, fail;

    beforeEach(() => {
      exec = enter(join(enter(context => ({ resume, fail } = context))));
    });
    it('is still running', () => { //invariant
      expect(exec.isRunning).toBe(true);
    });

    describe('when the joined operation resumes', () => {
      beforeEach(() => {
        resume(1234);
      });
      it('is completed', () => {
        expect(exec.isCompleted).toBe(true);
      });
      it('has the same result ', () => {
        expect(exec.result).toEqual(1234);
      });
    });

    describe('when the joined operation fails', () => {
      beforeEach(() => {
        fail(new Error('boom!'));
      });
      it('is errored', () => {
        expect(exec.isErrored).toBe(true);
      });
    });
  });

  describe('forking from a process', () => {
    let exec, resume, fail;

    beforeEach(() => {
      exec = enter(fork(context => ({ resume, fail } = context)));
    });

    it('makes the external process waiting and blocking', () => {
      expect(exec.isBlocking).toBe(true);
      expect(exec.isWaiting).toBe(true);
    });

    describe('resuming the forked process', () => {
      beforeEach(() => {
        resume();
      });
      it('completes the external process', () => {
        expect(exec.isCompleted).toBe(true);
      });
    });

    describe('failing the forked process', () => {
      beforeEach(() => {
        fail(new Error('boom!'));
      });

      it('fails the process', () => {
        expect(exec.isErrored).toBe(true);
      });
      it('has the error as the result', () => {
        expect(exec.result).toBeDefined();
        expect(exec.result.message).toEqual('boom!');
      });
    });
  });
});
