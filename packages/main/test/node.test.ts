import expect from 'expect';
import { describe, it, beforeEach } from '@effection/mocha';
import { Stream } from '@effection/stream';

import { exec, Process, ProcessResult } from '@effection/process';
import { terminate, interrupt } from './helpers';

describe('main', () => {
  let child: Process;
  let stdout: Stream<string>;

  describe('with successful process', () => {
    beforeEach(function*() {
      child = yield exec(`ts-node ./test/fixtures/text-writer.ts`);
      stdout = yield child.stdout.lines().buffered();

      yield stdout.grep("started").expect();
    });

    describe('interrupting the process', () => {
      beforeEach(function*() {
        interrupt(child);
        yield child.join();
      });

      it('shuts down gracefully', function*() {
        yield stdout.grep("stopped").expect();
      });
    });

    describe('terminating the process', () => {
      beforeEach(function*() {
        terminate(child);
        yield child.join();
      });

      it('shuts down gracefully', function*() {
        yield stdout.grep("stopped").expect();
      });
    });
  });

  describe('with failing process', () => {
    it('sets exit code and prints error', function*() {
      let result: ProcessResult = yield exec(`ts-node ./test/fixtures/main-failed.ts`).join();

      expect(result.stderr).toContain('Error');
      expect(result.stderr).toContain('moo');
      expect(result.code).toEqual(1);
    });

    it('sets custom exit code and hides error', function*() {
      let result: ProcessResult = yield exec(`ts-node ./test/fixtures/main-failed-custom.ts`).join();

      expect(result.stderr).toContain('It all went horribly wrong');
      expect(result.stderr).not.toContain('EffectionMainError');
      expect(result.code).toEqual(23);
    });
  });
});
