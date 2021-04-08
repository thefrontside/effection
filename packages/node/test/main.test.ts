import * as path from 'path';
import * as expect from 'expect';
import { describe, it, beforeEach } from '@effection/mocha';

import { exec, Process } from '../src/index';
import { terminate, interrupt } from './helpers';

describe('main', () => {
  let child: Process;

  describe('with successful process', () => {
    beforeEach(function*(world) {
      child = yield world.use(exec(`ts-node ./test/fixtures/text-writer.ts`, { buffered: true }));

      yield child.stdout.filter((s) => s.includes("started")).expect();
    });

    describe('interrupting the process', () => {
      beforeEach(function*() {
        interrupt(child);
        yield child.join();
      });

      it('shuts down gracefully', function*() {
        yield child.stdout.filter((s) => s.includes("stopped")).expect();
      });
    });

    describe('terminating the process', () => {
      beforeEach(function*() {
        terminate(child);
        yield child.join();
      });

      it('shuts down gracefully', function*() {
        yield child.stdout.filter((s) => s.includes("stopped")).expect();
      });
    });
  });

  describe('with failing process', () => {
    it('sets exit code and prints error', function*(world) {
      let child: Process = yield world.use(exec(`ts-node ./test/fixtures/main-failed.ts`, { buffered: true }));
      let status = yield child.join();
      let stderr = yield child.stderr.expect();

      expect(stderr).toContain('Error: moo');
      expect(status.code).toEqual(1);
    });

    it('sets custom exit code and hides error', function*(world) {
      let child: Process = yield world.use(exec(`ts-node ./test/fixtures/main-failed-custom.ts`, { buffered: true }));
      let status = yield child.join();
      let stderr = yield child.stderr.expect();

      expect(stderr).toContain('It all went horribly wrong');
      expect(stderr).not.toContain('EffectionMainError');
      expect(status.code).toEqual(23);
    });
  });
});
