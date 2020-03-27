import expect from 'expect';
import mock from 'jest-mock';
import { main, join } from '../src/index';

describe('execution', () => {

  describe('raw functions that resume immediately', () => {
    let exec, exit;
    beforeEach(() => {
      exit = mock.fn();
      exec = main(({ resume, ensure }) => {
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
      exec = main(({ fail, ensure }) => {
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
      exec = main(join(main(context => ({ resume, fail } = context))));
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
});
