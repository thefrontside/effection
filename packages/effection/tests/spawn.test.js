import expect from 'expect';
import { main } from '../src/index';

describe('spawning operations', () => {
  describe('with default resume/fail', () => {
    let context, child, resolve, reject;
    beforeEach(() => {
      context = main(({ spawn }) => {
        child = spawn(({ resume, fail }) => {
          resolve = resume;
          reject = fail;
        });
      });
    });
    it('is considered waiting without anything having happened to it.', () => {
      expect(context.isRunning).toEqual(true);
      expect(child.isRunning).toEqual(true);
    });
    it('creates a child for the spawn', () => {
      expect(context.children.has(child)).toEqual(true);
    });

    describe('resuming the child', () => {
      beforeEach(() => {
        resolve(5);
      });
      it('completes the child', () => {
        expect(child.isCompleted).toEqual(true);
        expect(context.children.size).toEqual(0);
      });
      it('does not complete the parent ', () => {
        expect(context.isRunning).toEqual(true);
      });
    });
    describe('failing the child context', () => {
      let boom;
      beforeEach(() => {
        reject(boom = new Error('boom!'));
      });
      it('fails the child, and also the parent', () => {
        expect(child.isErrored).toEqual(true);
        expect(child.result).toEqual(boom);
        expect(context.isErrored).toEqual(true);
        expect(context.result).toEqual(boom);
      });
    });

    describe('failing the parent', () => {
      beforeEach(() => {
        context.fail('parent failed');
      });
      it('halts the child', () => {
        expect(child.isHalted).toEqual(true);
      });
    });

    describe('halting the parent', () => {
      beforeEach(() => {
        context.halt('done');
      });
      it('halts the child', () => {
        expect(child.isHalted).toEqual(true);
      });
    });

    describe('resuming the parent', () => {
      beforeEach(() => {
        context.resume('parent done');
      });
      it('makes it complete, which immediately halts the child', () => {
        expect(context.state).toEqual('completed');
        expect(child.state).toEqual('halted');
      });
      describe('and then resuming the child', () => {
        beforeEach(() => {
          resolve('child done');
        });
        it('completes the parent', () => {
          expect(context.isCompleted).toEqual(true);
        });
      });

    });
  });
});
