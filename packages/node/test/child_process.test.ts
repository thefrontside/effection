import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect';
import fetch from 'node-fetch';

import { on } from '@effection/events';

import { World, TestStream } from './helpers';

import { spawn as spawnProcess, fork as forkProcess, ChildProcess } from '../src/child_process';

describe('child_process', () => {
  describe('spawnProcess', () => {
    let child: ChildProcess;

    beforeEach(async () => {
      child = spawnProcess(World, 'node', ['./fixtures/echo-server.js'], {
        env: { PORT: '29000', PATH: process.env.PATH },
        stdio: "pipe",
        cwd: __dirname,
      });
      let output;
      if (child.stdout) {
        output = new TestStream(World, child.stdout);
        await World.spawn(output.waitFor("listening"));
      }
    });

    it('starts the given child', async () => {
      let result = await fetch('http://localhost:29000', { method: "POST", body: "hello" });
      let text = await result.text();

      expect(result.status).toEqual(200);
      expect(text).toEqual("hello");
    });
  });

  describe('forkProcess', () => {
    let child: ChildProcess;

    beforeEach(async () => {
      child = forkProcess(World, './fixtures/echo-server.js', [], {
        env: { PORT: '29000' },
        stdio: "pipe",
        cwd: __dirname,
      });
      let output;
      if (child.stdout) {
        output = new TestStream(World, child.stdout);
        await World.spawn(output.waitFor("listening"))
      }
    });

    it('starts the given child', async () => {
      let result = await fetch('http://localhost:29000', { method: "POST", body: "hello" });
      let text = await result.text();

      expect(result.status).toEqual(200);
      expect(text).toEqual("hello");
    });

    it('can send messages', async () => {
      let messages = await on(World, child, "message");
      child.send("moo");
      let { value } = await World.spawn(messages.next());

      expect(value).toEqual(["moo", undefined]);
    });
  });
});
