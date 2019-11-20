import expect from 'expect';
import mock from 'jest-mock';

import { fork } from '../src/index';

async function suspend() {}

describe('forks as promises', () => {
  let root, child;

  beforeEach(async () => {
    root = fork(function*() {
      child = fork(function* () {
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
      await suspend();

      expect(onResolveRoot).not.toHaveBeenCalled();
      expect(onResolveChild).not.toHaveBeenCalled();
      expect(onRejectRoot).not.toHaveBeenCalled()
      expect(onRejectChild).not.toHaveBeenCalled()
    });

    it('resolves inner when inner operation finishes', async () => {
      child.resume(123);
      await suspend();

      expect(onResolveRoot).not.toHaveBeenCalled();
      expect(onResolveChild).toHaveBeenCalledWith(123);
      expect(onRejectRoot).not.toHaveBeenCalled()
      expect(onRejectChild).not.toHaveBeenCalled()
    });

    it('resolves when operation and all children finish', async () => {
      child.resume(123);
      root.resume(567);
      await suspend();

      expect(onResolveRoot).toHaveBeenCalledWith(567);
      expect(onResolveChild).toHaveBeenCalledWith(123);
      expect(onRejectRoot).not.toHaveBeenCalled()
      expect(onRejectChild).not.toHaveBeenCalled()
    });

    it('rejects when child errors', async () => {
      child.throw(new Error('boom'));
      await suspend();

      expect(onResolveRoot).not.toHaveBeenCalled();
      expect(onResolveChild).not.toHaveBeenCalled();
      expect(onRejectRoot).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
      expect(onRejectChild).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
    });

    it('rejects when parent errors (child is halted)', async () => {
      root.throw(new Error('boom'));
      await suspend();

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

    it('rejects with halt when parent halts', async () => {
      root.halt();
      await suspend();

      expect(onResolveRoot).not.toHaveBeenCalled();
      expect(onResolveChild).not.toHaveBeenCalled();
      expect(onRejectRoot).toHaveBeenCalledWith(expect.objectContaining({ message: 'halt' }));
      expect(onRejectChild).toHaveBeenCalledWith(expect.objectContaining({ message: 'halt' }));
    });

    it('rejects with halt with result when parent halts', async () => {
      root.halt(999);
      await suspend();

      expect(onResolveRoot).not.toHaveBeenCalled();
      expect(onResolveChild).not.toHaveBeenCalled();
      expect(onRejectRoot).toHaveBeenCalledWith(expect.objectContaining({ message: 'halt', cause: 999 }));
      expect(onRejectChild).toHaveBeenCalledWith(expect.objectContaining({ message: 'halt', cause: 999 }));
    });
  });

  describe('with promise attached after finalization', function() {
    it('starts is resolved immediately', async () => {
      child.resume(567);
      root.resume(123);
      await expect(child).resolves.toBe(567);
      await expect(root).resolves.toBe(123);
    });

    it('starts is rejected immediately if halted', async () => {
      root.halt();
      await expect(root).rejects.toThrow('halt');
    });

    it('starts is rejected immediately if errored', async () => {
      root.throw(new Error('boom'));
      await expect(root).rejects.toThrow('boom');
    });
  });
});
