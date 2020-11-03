import * as path from 'path';
import * as expect from 'expect';
import { describe, it, beforeEach } from 'mocha';

import { TestProcess } from './helpers';

describe('main', () => {
  let child: TestProcess;

  describe('with sucessful process', () => {
    beforeEach(async () => {
      child = await TestProcess.exec(`ts-node ${[path.join(__dirname, 'fixtures/text-writer.ts')]}`);

      await child.stdout.detect("started");
    });

    describe('interrupting the process', () => {
      beforeEach(async () => {
        setTimeout(() => child.interrupt(), 10);
        await child.join();
      });

      it('shuts down gracefully', async () => {
        await child.stdout.detect("stopped");
      });
    });

    describe('terminating the process', () => {
      beforeEach(async () => {
        child.terminate();
        await child.join();
      });

      it('shuts down gracefully', async () => {
        await child.stdout.detect("stopped");
      });
    });
  });

  describe('with failing process', () => {
    it('sets exit code and prints error', async () => {
      let child = await TestProcess.exec(`ts-node ${[path.join(__dirname, 'fixtures/main-failed.ts')]}`);
      let status = await child.join();

      expect(child.stderr.output).toContain('Error: moo');
      expect(status.code).toEqual(255);
    });

    it('sets custom exit code and hides error', async () => {
      let child = await TestProcess.exec(`ts-node ${[path.join(__dirname, 'fixtures/main-failed-custom.ts')]}`);
      let status = await child.join();

      expect(child.stderr.output).toContain('It all went horribly wrong');
      expect(child.stderr.output).not.toContain('EffectionMainError');
      expect(status.code).toEqual(23);
    });

    it('can override error handler', async () => {
      let child = await TestProcess.exec(`ts-node ${[path.join(__dirname, 'fixtures/main-failed-on-error.ts')]}`);
      let status = await child.join();

      expect(child.stderr.output).toContain('GOT ERROR: moo');
      expect(status.code).toEqual(47);
    });
  });
});
