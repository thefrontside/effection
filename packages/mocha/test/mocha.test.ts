import { describe, it, beforeEach, captureError } from '../src/index';
import * as expect from 'expect';

import { Task, sleep } from '@effection/core';

let captured: Task;

function* boom() {
  throw new Error('boom');
}

describe('@effection/mocha', () => {
  // TODO: how can we test that a test should fail? Spawn external mocha process?
  // it('throws error', function*(task) {
  //   task.spawn(function*() {
  //     try {
  //       yield sleep(3);
  //     } finally {
  //       throw new Error('boom');
  //     }
  //   });
  //   yield sleep(10);
  // });

  describe('accessing mocha API', () => {
    it('works', function*() {
      this.timeout(100);
    });
  });

  describe('cleaning up tasks', () => {
    it('sets up task', function*(task) {
      captured = task.spawn();
    });

    it('and cleans it up', function*() {
      expect(captured.state).toEqual('halted');
    });
  });

  describe('captureError', () => {
    it('returns error thrown by given operation', function*() {
      expect(yield captureError(boom)).toHaveProperty('message', 'boom');
    });

    it('throws an error if given operation does not throw an error', function*() {
      expect(yield captureError(captureError(function*() {}))).toHaveProperty('message', 'expected operation to throw an error, but it did not!');
    });
  });

  describe('spawning in world', () => {
    beforeEach(function*(world) {
      captured = world.spawn();
    });

    it('does not halt the spawned task before it block', function*() {
      expect(captured.state).toEqual('running');
    });
  });

  describe('spawning in scope', () => {
    beforeEach(function*(world, scope) {
      captured = scope.spawn();
    });

    it('halts the spawned task before it block', function*() {
      expect(captured.state).toEqual('halted');
    });
  });
});
