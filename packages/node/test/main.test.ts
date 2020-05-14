import * as path from 'path';
import { describe, it, beforeEach } from 'mocha';
import { ChildProcess, spawn as spawnProcess } from 'child_process';
import { once } from '@effection/events';

import { World, TestStream } from './helpers';

describe('main', () => {
  let child: ChildProcess;
  let stdout: TestStream;
  beforeEach(async () => {
    child = spawnProcess("ts-node", [path.join(__dirname, 'text-writer.ts')]);

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
