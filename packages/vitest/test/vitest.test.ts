import { describe, it, beforeEach, captureError } from '../src/index';
import { expect } from 'vitest';
import { Task, Resource, spawn, sleep } from 'effection';
import { exec } from '@effection/process';
import { dirname } from 'path';

let captured: Task;

function* boom() {
  throw new Error('boom');
}

const myResource: Resource<Task> = {
  *init() {
    return yield spawn();
  },
};

const cwd = dirname(__dirname);

describe('@effection/vitest', () => {
  it('applies labels', function* (scope) {
    expect(scope.labels.name).toContain('it("applies labels")');
  });

  it(
    'throws error on failure',
    function* () {
      let { code, stderr } = yield exec(
        'yarn vitest run direct-error.failure.ts --no-color --config vite.test.config.ts',
        { cwd }
      ).join();
      expect(code).toEqual(1);
      expect(stderr).toContain('boom\n');
    },
    process.env.CI ? 30000 : undefined
  );

  it(
    'throws error on failure in background task',
    function* () {
      let { code, stderr } = yield exec(
        'yarn vitest run spawned-error.failure.ts --no-color --config vite.test.config.ts',
        { cwd }
      ).join();
      expect(code).toEqual(1);
      expect(stderr).toContain('boom');
    },
    process.env.CI ? 30000 : undefined
  );

  it(
    'throws error on failure in suite scope',
    function* () {
      let { code, stderr } = yield exec(
        'yarn vitest run error-in-beforeall.failure.ts --no-color --config vite.test.config.ts',
        { cwd }
      ).join();
      expect(code).toEqual(1);
      expect(stderr).toContain('boom');
    },
    process.env.CI ? 30000 : undefined
  );

  it(
    'throws error on failure in suite scope',
    function* () {
      let { code, stderr } = yield exec(
        'yarn vitest run beforeach-spawned-failure.ts --no-color --config vite.test.config.ts',
        { cwd }
      ).join();
      expect(code).toEqual(1);
      expect(stderr).toContain('boom');
    },
    process.env.CI ? 30000 : undefined
  );

  it.todo('can have pending tasks (note: this is not actually pending)');

  describe('accessing the Vitest Context API', () => {
    beforeEach(function* () {
      //@ts-expect-error TODO Type 'Generator<any, void, Task<unknown>>' is not assignable to type 'PromiseLike<HookCleanupCallback>'
      this.contextValue = 'hello Vitest';
    });

    it('works', function* () {
      expect(this.contextValue).toEqual('hello Vitest');
    });
  });

  describe('cleaning up tasks', () => {
    it('sets up task', function* (task) {
      captured = yield task.spawn();
    });

    it('and cleans it up', function* () {
      expect(captured.state).toEqual('halted');
    });
  });

  describe('captureError', () => {
    it('returns error thrown by given operation', function* () {
      expect(yield captureError(boom)).toHaveProperty('message', 'boom');
    });

    it('throws an error if given operation does not throw an error', function* () {
      expect(yield captureError(captureError(function* () {}))).toHaveProperty(
        'message',
        'expected operation to throw an error, but it did not!'
      );
    });
  });

  describe('spawning in world', () => {
    //@ts-expect-error TODO Type 'Generator<any, void, Task<unknown>>' is not assignable to type 'PromiseLike<HookCleanupCallback>'
    beforeEach(function* (world) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore TODO Property 'spawn' does not exist on type 'Suite'.
      captured = yield world.spawn();
    });

    it('does not halt the spawned task before it block', function* () {
      expect(captured.state).toEqual('running');
    });
  });

  describe('spawning in scope', () => {
    //@ts-expect-error TODO Type 'Generator<any, void, Task<unknown>>' is not assignable to type 'PromiseLike<HookCleanupCallback>'
    beforeEach(function* (_world, scope) {
      captured = yield scope.spawn();
    });

    it('halts the spawned task before it block', function* () {
      expect(captured.state).toEqual('halted');
    });
  });

  describe('spawning resource in world', () => {
    beforeEach(function* () {
      captured = yield myResource;
    });

    it('keeps running beyond the before each block', function* () {
      expect(captured.state).toEqual('running');
    });
  });

  describe('.eventually()', () => {
    beforeEach(function* () {
      //@ts-expect-error TODO issue with this, implicit any type, not enough typing in lib?
      this.tries = 0;
    });

    it.eventually(
      'passes if the operation passes within timeout',
      function* () {
        yield sleep(1);
        (this.tries as number)++;
        expect(this.tries).toBeGreaterThan(10);
      }
    );
  });
});
