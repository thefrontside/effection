import './setup';
import { describe, beforeEach, it } from 'mocha';
import * as expect from 'expect';

import { run, sleep, Operation, Task } from '../src/index';

describe('Task', () => {
  describe('catchHalt', () => {
    it('catches halt errors and resolves to undefined', async () => {
      let task = run();

      await task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted');
      await expect(task.catchHalt()).resolves.toEqual(undefined);
    });
  });

  describe('event: state', () => {
    it('is triggered when a task changes state', async () => {
      let events: { to: string, from: string }[] = []
      let task = new Task(function*() { sleep(5) });

      task.on('state', (transition) => events.push(transition));

      task.start();

      await task;

      expect(events).toEqual([
        { from: 'pending', to: 'running' },
        { from: 'running', to: 'completing' },
        { from: 'completing', to: 'completed' },
      ]);
    });
  });

  describe('event: link', () => {
    it('is triggered when a child is spawned', async () => {
      let events: Task[] = []
      let task = run();

      task.on('link', (child) => events.push(child));

      let child = task.spawn();

      expect(events).toEqual([child]);
    });
  });

  describe('event: unlink', () => {
    it('is triggered when a child terminates', async () => {
      let events: Task[] = []
      let task = run();

      task.on('unlink', (child) => events.push(child));

      let child = task.spawn(function*() { yield sleep(5); return 1 });

      expect(events).toEqual([]);
      await child;
      expect(events).toEqual([child]);
    });

    it('is triggered when a child halts', async () => {
      let events: Task[] = []
      let task = run();

      task.on('unlink', (child) => events.push(child));

      let child = task.spawn(function*() { yield sleep(5); return 1 });

      expect(events).toEqual([]);
      await child.halt();
      expect(events).toEqual([child]);
    });
  });
});
