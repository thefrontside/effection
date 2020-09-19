import './helpers';

import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect'

import { sleep, run, Task } from '@effection/core';
import { EventEmitter } from 'events';

import { once } from '../src/index';

describe("once()", () => {
  let task: Task;
  let source: EventEmitter;

  beforeEach(() => {
    source = new EventEmitter();
    task = run(function*() {
      return yield once(source, 'event');
    });
  });

  it('pauses before the event is received', () => {
    expect(task.state).toEqual("running");
  });

  describe('emitting the event on which it is waiting', () => {
    beforeEach(() => {
      source.emit('event', 1,2,10);
    });

    it('returs the parameters of the event', async () => {
      await expect(task).resolves.toEqual([1,2,10]);
    });
  });

  describe('emitting an event on which it is not waiting', () => {
    beforeEach(async () => {
      source.emit('non-event', 1, 2, 10);
      await run(sleep(10)); });

    it('remains paused', () => {
      expect(task.state).toEqual('running');
    });
  });

  describe('shutting down the task and then emitting the event on which it is waiting', () => {
    beforeEach(() => {
      task.halt();
      source.emit('event', 1, 2, 10);
    });

    it('never returns', () => {
      expect(task.result).toBeUndefined();
    });
  });
});
