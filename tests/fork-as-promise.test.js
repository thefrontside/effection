import expect from 'expect';
import mock from 'jest-mock';

import { spawn, fork } from '../src/index';

const HALT = expect.stringContaining('Interrupted');
async function suspend() {}

describe('forks as promises', () => {
  let root, child, awaken;

  beforeEach(async () => {
    root = spawn(function*() {
      child = yield fork();
      return yield ({ resume }) => awaken = resume;
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

    describe('when the inner operation finishes', () => {
      beforeEach(async () => {
        child.resume(123);
      });

      it('resolves inner promise', () => {
        expect(onResolveRoot).not.toHaveBeenCalled();
        expect(onResolveChild).toHaveBeenCalledWith(123);
        expect(onRejectRoot).not.toHaveBeenCalled();
        expect(onRejectChild).not.toHaveBeenCalled();
      });
    });

    describe('when operation and all childen finish', () => {
      beforeEach(async () => {
        child.resume(123);
        awaken(567);
      });

      it('resolves', () => {
        expect(onResolveRoot).toHaveBeenCalledWith(567);
        expect(onResolveChild).toHaveBeenCalledWith(123);
        expect(onRejectRoot).not.toHaveBeenCalled();
        expect(onRejectChild).not.toHaveBeenCalled();
      });
    });

    describe('when child errors', () => {
      beforeEach(async () => {
        child.fail(new Error('boom'));
      });

      it('rejects when child errors', () => {
        expect(onResolveRoot).not.toHaveBeenCalled();
        expect(onResolveChild).not.toHaveBeenCalled();
        expect(onRejectRoot).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
        expect(onRejectChild).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
      });

    });

    describe('when parent errors because child is halted', () => {
      beforeEach(async () => {
        root.fail(new Error('boom'));
      });

      it('rejects', async () => {
        expect(onResolveRoot).not.toHaveBeenCalled();
        expect(onResolveChild).not.toHaveBeenCalled();
        expect(onRejectRoot).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'boom' })
        );
        expect(onRejectChild).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Interrupted'),
            cause: expect.objectContaining({ message: 'boom' })
          })
        );
      });
    });

    describe('when parent halts', () => {
      beforeEach(async () => {
        root.halt(999);
      });

      it('rejects with halt with result', () => {
        expect(onResolveRoot).not.toHaveBeenCalled();
        expect(onResolveChild).not.toHaveBeenCalled();
        expect(onRejectRoot).toHaveBeenCalledWith(expect.objectContaining({ message: HALT, cause: 999 }));
        expect(onRejectChild).toHaveBeenCalledWith(expect.objectContaining({ message: HALT, cause: 999 }));
      });
    });


  });

  describe('with promise attached after finalization', function() {
    it('starts is resolved immediately', async () => {
      child.resume(567);
      awaken(123);
      await expect(child).resolves.toBe(567);
      await expect(root).resolves.toBe(123);
    });

    it('starts is rejected immediately if halted', async () => {
      root.halt('stop');
      await suspend();
      await expect(root).rejects.toThrow("stop");
    });

    it('starts is rejected immediately if errored', async () => {
      root.fail(new Error('boom'));
      expect(root.result.message).toEqual('boom');
    });
  });
});
