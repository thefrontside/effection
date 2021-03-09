import { describe, it, beforeEach } from '@effection/mocha';
import * as expect from 'expect'

import { sleep, Task } from '@effection/core';
import { EventEmitter } from 'events';

import { once } from '../src/index';

describe("once()", () => {
  let task: Task;
  let source: EventEmitter;

  beforeEach(function*(t) {
    source = new EventEmitter();
    task = t.spawn(once(source, 'event'));
  });

  it('pauses before the event is received', function*() {
    expect(task.state).toEqual("running");
  });

  describe('emitting the event on which it is waiting', () => {
    beforeEach(function*() {
      source.emit('event', 1,2,10);
    });

    it('returs the parameters of the event', function*() {
      expect(yield task).toEqual([1,2,10]);
    });
  });

  describe('emitting an event on which it is not waiting', () => {
    beforeEach(function*() {
      source.emit('non-event', 1, 2, 10);
      yield sleep(10);
    });

    it('remains paused', function*() {
      expect(task.state).toEqual('running');
    });
  });

  describe('shutting down the task and then emitting the event on which it is waiting', () => {
    beforeEach(function*() {
      yield task.halt();
      source.emit('event', 1, 2, 10);
    });

    it('never returns', function*() {
      expect(task.result).toBeUndefined();
    });
  });
});
