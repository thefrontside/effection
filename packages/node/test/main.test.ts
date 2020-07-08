import * as path from 'path';
import * as expect from 'expect';
import { describe, it, beforeEach } from 'mocha';
import { ChildProcess, spawn as spawnProcess, spawnSync } from 'child_process';
import { once } from '@effection/events';

import { World, TestStream } from './helpers';

describe('main', () => {
  let child: ChildProcess;
  let stdout: TestStream;

  describe('with sucessful process', () => {
    beforeEach(async () => {
      child = spawnProcess("ts-node", [path.join(__dirname, 'fixtures/text-writer.ts')]);

      if (child.stdout) {
        stdout = await World.spawn(TestStream.of(child.stdout));
        await World.spawn(stdout.waitFor("started"));
      }
    });
    afterEach(() => {
      child.kill('SIGKILL');
    })

    describe('sending SIGINT', () => {
      beforeEach(async () => {
        setTimeout(() => child.kill('SIGINT'), 10);
        await World.spawn(once(child, 'exit'));
      });

      it('shuts down gracefully', async () => {
        await World.spawn(stdout.waitFor("stopped"));
      });
    });

    describe('sending SIGTERM', () => {
      beforeEach(async () => {
        child.kill('SIGTERM');
        await World.spawn(once(child, 'exit'));
      });

      it('shuts down gracefully', async () => {
        await World.spawn(stdout.waitFor("stopped"));
      });
    });
  });

  describe('with failing process', () => {
    it('sets exit code and prints error', async () => {
      let result = spawnSync("ts-node", [path.join(__dirname, 'fixtures/main-failed.ts')]);

      expect(result.stderr.toString()).toContain('moo');
      expect(result.status).toEqual(255);
    });

    it('sets custom exit code and hides error', async () => {
      let result = spawnSync("ts-node", [path.join(__dirname, 'fixtures/main-failed-custom.ts')]);

      expect(result.stderr.toString()).not.toContain('moo');
      expect(result.status).toEqual(23);
    });
  });
});
