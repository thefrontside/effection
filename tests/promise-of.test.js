import expect from 'expect';

import { execute } from '../src/index';

describe('yielding on a promise', () => {
  let execution, deferred, error;

  beforeEach(() => {
    error = undefined;
    deferred = new Deferred();
    execution = execute(function*() {
      try {
        return yield deferred.promise;
      } catch (e) {
        error = e;
      }
    });
  });

  describe('when the promise resolves', () => {
    beforeEach(() => {
      return deferred.resolve('hello');
    });

    it('completes the execution with the result', () => {
      expect(execution.isCompleted).toEqual(true);
      expect(execution.result).toEqual('hello');
    });
  });

  describe('when the promise rejects', () => {
    let boom;
    beforeEach(() => {
      boom = new Error('boom!');
      return deferred.reject(boom).catch(() => {});
    });

    it('errors out the execution', () => {
      expect(error).toEqual(boom);
    });
  });

  describe('when the promise resolves after halting execution', () => {
    beforeEach(() => {
      execution.halt();
      return deferred.resolve('hi');
    });

    it('is no problem', () => {
      expect(execution.isHalted).toEqual(true);
    });
  });

  describe('when the promise rejects after halting execution', () => {
    beforeEach(() => {
      execution.halt();
      return deferred.reject(new Error('boom!')).catch(() => {});
    });

    it('is no problem', () => {
      expect(execution.isHalted).toEqual(true);
      expect(error).toBeUndefined();
    });
  });
});

function Deferred() {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = value => {
      resolve(value);
      return this.promise;
    };
    this.reject = error => {
      reject(error);
      return this.promise;
    };
  });
}
