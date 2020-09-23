import * as path from 'path';
import * as expect from 'expect';
import { describe, it, beforeEach } from 'mocha';
import { ChildProcess, spawnProcess } from '../src/child_process';
import { once } from '@effection/events';

import { World, TestStream } from './helpers';

describe('main', () => {
  let child: ChildProcess;
  let stdout: TestStream;

  describe('with successful process', () => {
    beforeEach(async () => {
      child = spawnProcess("ts-node", ['./fixtures/text-writer.ts'], {
        // set cwd here as depending on where this is run from
        // it won't properly pick up the tsconfig and transpile
        // the generators correctly
        cwd: __dirname,
      });

      if (child?.stdout) {
        stdout = await World.spawn(TestStream.of(child.stdout));
        await World.spawn(stdout.waitFor("started"));
      }
    });

    describe('sending SIGINT', () => {
      beforeEach(async () => {
        setTimeout(() => child.kill('SIGINT'), 10);
        await World.spawn(once(child, 'exit'));
      });

      it('shuts down gracefully', async () => {
        // we don't seem to reach the `finally` on windows
        // even though the exit event fires properly
        if (process.platform !== 'win32')
          await World.spawn(stdout.waitFor("stopped"));
      });
    });

    describe('sending SIGTERM', () => {
      beforeEach(async () => {
        child.kill('SIGTERM');
        await World.spawn(once(child, 'exit'));
      });

      it('shuts down gracefully', async () => {
        // we don't seem to reach the `finally` on windows
        // even though the exit event fires properly
        if (process.platform !== 'win32')
          await World.spawn(stdout.waitFor("stopped"));
      });
    });
  });

  describe('with failing process', () => {
    it('sets exit code and prints error', function* () {
      let result = yield spawnProcess("ts-node", ['./fixtures/main-failed.ts']);

      expect(result.stderr).toContain('Error: moo');
      expect(result.status).toEqual(255);
    });

    it('sets custom exit code and hides error', function* () {
      let result = yield spawnProcess("ts-node", ['./fixtures/main-failed-custom.ts']);

      expect(result.stderr).toContain('It all went horribly wrong');
      expect(result.stderr).not.toContain('EffectionMainError');
      expect(result.status).toEqual(23);
    });
  });
});