import './setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { run, sleep, Task } from '../src/index';

describe('Task', () => {
  describe('ensure', () => {
    it('attaches a handler which runs when the task finishes normally', async () => {
      let task = run(sleep(10));
      let didRun = false;

      task.ensure(() => {
        didRun = true;
      });

      await expect(task).resolves.toEqual(undefined);
      expect(didRun).toEqual(true);
    });

    it('attaches a handler which runs when the task finishes errors', async () => {
      let task = run(function*() {
        yield sleep(5)
        throw new Error('boom');
      });
      let didRun = false;

      task.ensure(() => {
        didRun = true;
      });

      await expect(task).rejects.toHaveProperty('message', 'boom');
      expect(didRun).toEqual(true);
    });

    it('attaches a handler which runs when the task halts', async () => {
      let task = run();
      let didRun = false;

      task.ensure(() => {
        didRun = true;
      });

      await task.halt();

      await expect(task).rejects.toHaveProperty('message', 'halted');
      expect(didRun).toEqual(true);
    });
  });

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
      let events: { to: string; from: string }[] = []
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
