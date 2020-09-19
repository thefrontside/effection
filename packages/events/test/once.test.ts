import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect'

import { sleep, Task } from 'effection';
import { EventEmitter } from 'events';

import { World } from './helpers';

import { once } from '../src/index';

describe("once()", () => {
  let task: Task;
  let source: EventEmitter;

  beforeEach(() => {
    source = new EventEmitter();
    task = World.spawn(function*() {
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
      await World.spawn(sleep(10));
    });

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
      expect(task.state).toEqual('running');
    });
  });
});
