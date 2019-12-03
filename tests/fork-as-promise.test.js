import expect from 'expect';
import mock from 'jest-mock';

import { fork } from '../src/index';

describe('forks as promises', () => {
  let root, child;

  beforeEach((done) => {
    root = fork(function*() {
      child = fork(function* () {
        done();
        return yield;
      });
      return yield;
    });
  });

  describe('with promise attached before finalization', function() {
    let onResolveRoot, onRejectRoot, onResolveChild, onRejectChild;

    beforeEach(function() {
      onResolveRoot = mock.fn(x => x);
      onRejectRoot = mock.fn(x => x);
      onResolveChild = mock.fn(x => x);
      onRejectChild = mock.fn(x => x);

      child.then(onResolveChild, onRejectChild);
      root.then(onResolveRoot, onRejectRoot);
    });

    it('starts off in pending state', async () => {
      expect(onResolveRoot).not.toHaveBeenCalled();
      expect(onResolveChild).not.toHaveBeenCalled();
      expect(onRejectRoot).not.toHaveBeenCalled();
      expect(onRejectChild).not.toHaveBeenCalled();
    });


    describe('when inner operation finishes', () => {
      beforeEach(async () => {
        child.resume(123);
      });

      it('resolves inner', () => {
        expect(onResolveRoot).not.toHaveBeenCalled();
        expect(onResolveChild).toHaveBeenCalledWith(123);
        expect(onRejectRoot).not.toHaveBeenCalled();
        expect(onRejectChild).not.toHaveBeenCalled();
      });
    });



    describe('when operation and all children finish', () => {
      beforeEach(async () => {
        child.resume(123);
        root.resume(567);
      });

      it('resolves when operation and all children finish', () => {
        expect(onResolveRoot).toHaveBeenCalledWith(567);
        expect(onResolveChild).toHaveBeenCalledWith(123);
        expect(onRejectRoot).not.toHaveBeenCalled();
        expect(onRejectChild).not.toHaveBeenCalled();
      });
    });


    describe('when child errors', () => {
      beforeEach(async () => {
        child.throw(new Error('boom'));
      });

      it('rejects',  () => {
        expect(onResolveRoot).not.toHaveBeenCalled();
        expect(onResolveChild).not.toHaveBeenCalled();
        expect(onRejectRoot).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
        expect(onRejectChild).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
      });
    });

    describe('when parent errors', () => {
      beforeEach(async () => {
        root.throw(new Error('boom'));
      });

      it('rejects the parent and child (halted)', () => {
        expect(onResolveRoot).not.toHaveBeenCalled();
        expect(onResolveChild).not.toHaveBeenCalled();
        expect(onRejectRoot).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'boom' })
        );
        expect(onRejectChild).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'halt',
            cause: expect.objectContaining({ message: 'boom' })
          })
        );
      });
    });

    describe('when parent halts with no result', () => {
      beforeEach(async () => {
        root.halt();
      });

      it('rejects with halt when parent halts', () => {
        expect(onResolveRoot).not.toHaveBeenCalled();
        expect(onResolveChild).not.toHaveBeenCalled();
        expect(onRejectRoot).toHaveBeenCalledWith(expect.objectContaining({ message: 'halt' }));
        expect(onRejectChild).toHaveBeenCalledWith(expect.objectContaining({ message: 'halt' }));
      });
    });

    describe('when parent halts with reason', () => {
      beforeEach(async () => {
        root.halt(999);
      });

      it('rejects with halt with result when parent halts', () => {
        expect(onResolveRoot).not.toHaveBeenCalled();
        expect(onResolveChild).not.toHaveBeenCalled();
        expect(onRejectRoot).toHaveBeenCalledWith(expect.objectContaining({ message: 'halt', cause: 999 }));
        expect(onRejectChild).toHaveBeenCalledWith(expect.objectContaining({ message: 'halt', cause: 999 }));
      });
    });
  });

  describe('with promise attached after finalization', function() {
    describe('when completed', () => {
      beforeEach(async () => {
        child.resume(567);
        root.resume(123);
      });

      it('starts is resolved immediately', async () => {
        await expect(child).resolves.toBe(567);
        await expect(root).resolves.toBe(123);
      });
    });

    describe('when halted', () => {
      beforeEach(async () => {
        root.halt();
      });
      it('starts is rejected immediately if halted', async () => {
        await expect(root).rejects.toThrow('halt');
      });
    });



    it('starts is rejected immediately if errored', async () => {
      root.throw(new Error('boom'));
      await expect(root).rejects.toThrow('boom');
    });
  });
});
