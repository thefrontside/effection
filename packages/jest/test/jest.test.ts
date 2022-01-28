import { describe, it, beforeEach, captureError } from '../src/index';

import { Task, Resource, spawn } from 'effection';
import { exec } from '@effection/process';

let captured: Task;

function* boom() {
  throw new Error('boom');
}

const myResource: Resource<Task> = {
  *init() {
    return yield spawn();
  }
};

describe('@effection/jest', () => {
  it('applies labels', function*(scope) {
    expect(scope.labels.name).toContain('it("applies labels")');
  });

  it('throws error on failure', function*() {
    let { code, stderr } = yield exec('yarn jest --testMatch "**/test/direct-error.failure.ts" --no-colors').join();
    expect(code).toEqual(1);
    expect(stderr).toContain('boom');
  }, process.env.CI ? 30000 : undefined);

  it('throws error on failure in background task', function*() {
    let { code, stderr } = yield exec('yarn jest --testMatch "**/test/spawned-error.failure.ts" --no-colors').join();
    expect(code).toEqual(1);
    expect(stderr).toContain('boom');
  }, process.env.CI ? 30000 : undefined);

  it('throws error on failure in suite scope', function*() {
    let { code, stderr } = yield exec('yarn jest --testMatch "**/test/error-in-beforeall.failure.ts" --no-colors').join();
    expect(code).toEqual(1);
    expect(stderr).toContain('boom');
  }, process.env.CI ? 30000 : undefined);

  it('throws error on failure in suite scope', function*() {
    let { code, stderr } = yield exec('yarn jest --testMatch "**/test/beforeach-spawned-failure.ts" --no-colors').join();
    expect(code).toEqual(1);
    expect(stderr).toContain('boom');
  }, process.env.CI ? 30000 : undefined);



  it.todo('can have pending tasks (note: this is not actually pending)');

  describe('accessing the Jest Context API', () => {
    beforeEach(function*() {
      this.contextValue = 'hello Jest';
    });

    it('works', function*() {
      expect(this.contextValue).toEqual('hello Jest');
    });
  });

  describe('cleaning up tasks', () => {
    it('sets up task', function*(task) {
      captured = yield task.spawn();
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
      captured = yield world.spawn();
    });

    it('does not halt the spawned task before it block', function*() {
      expect(captured.state).toEqual('running');
    });
  });

  describe('spawning in scope', () => {
    beforeEach(function*(_world, scope) {
      captured = yield scope.spawn();
    });

    it('halts the spawned task before it block', function*() {
      expect(captured.state).toEqual('halted');
    });
  });

  describe('spawning resource in world', () => {
    beforeEach(function*() {
      captured = yield myResource;
    });

    it('keeps running beyond the before each block', function*() {
      expect(captured.state).toEqual('running');
    });
  });
});
