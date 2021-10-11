import { describe, it, beforeEach, captureError } from '../src/index';
import expect from 'expect';

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

describe('@effection/mocha', () => {
  it('applies labels', function*(world, local) {
    expect(world.labels.name).toEqual('world');
    expect(local.labels.name).toContain('it("applies labels")');
  });

  it('throws error on failure', function*() {
    let result = yield exec('yarn mocha test/direct-error.failure.ts').join();
    expect(result.code).toEqual(1);
    expect(result.stdout).toContain('Error: boom');
  });

  it('throws error on failure in background task', function*() {
    let result = yield exec('yarn mocha test/spawned-error.failure.ts').join();
    expect(result.code).toEqual(2);
    expect(result.stdout).toContain('Error: boom');
  });

  it('can have pending tasks (note: this is not actually pending)');

  describe('accessing mocha API', () => {
    it('works', function*() {
      this.timeout(100);
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
