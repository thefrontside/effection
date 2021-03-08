import * as path from 'path';
import * as expect from 'expect';
import { describe, it, beforeEach } from '@effection/mocha';

import { Effection } from '@effection/core';
import { TestProcess } from './helpers';

describe('main', () => {
  let child: TestProcess;

  describe('with successful process', () => {
    beforeEach(function*() {
      child = TestProcess.exec(Effection.root, `ts-node ./fixtures/text-writer.ts`);

      yield child.stdout.detect("started");
    });

    describe('interrupting the process', () => {
      beforeEach(function*() {
        child.interrupt();
        yield child.join();
      });

      it('shuts down gracefully', function*() {
        yield child.stdout.detect("stopped");
      });
    });

    describe('terminating the process', () => {
      beforeEach(function*() {
        child.terminate();
        yield child.join();
      });

      it('shuts down gracefully', function*() {
        yield child.stdout.detect("stopped");
      });
    });
  });

  describe('with failing process', () => {
    it('sets exit code and prints error', function*() {
      let child = TestProcess.exec(Effection.root, `ts-node ./fixtures/main-failed.ts`);
      let status = yield child.join();

      expect(child.stderr.output).toContain('Error: moo');
      expect(status.code).toEqual(1);
    });

    it('sets custom exit code and hides error', function*() {
      let child = TestProcess.exec(Effection.root, `ts-node ./fixtures/main-failed-custom.ts`);
      let status = yield child.join();

      expect(child.stderr.output).toContain('It all went horribly wrong');
      expect(child.stderr.output).not.toContain('EffectionMainError');
      expect(status.code).toEqual(23);
    });
  });
});
