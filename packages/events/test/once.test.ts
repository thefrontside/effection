import { describe, it, beforeEach } from '@effection/mocha';
import expect from 'expect'

import { sleep, Task } from '@effection/core';
import { EventEmitter } from 'events';

import { once, onceEmit } from '../src/index';

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
      source.emit('event', 1);
    });

    it('returns the first parameter of the event', function*() {
      expect(yield task).toEqual(1);
    });
  });

  describe('emitting an event on which it is not waiting', () => {
    beforeEach(function*() {
      source.emit('non-event', 1);
      yield sleep(10);
    });

    it('remains paused', function*() {
      expect(task.state).toEqual('running');
    });
  });
});

describe('onceEmit()', () => {
  let task: Task;
  let source: EventEmitter;

  beforeEach(function*(t) {
    source = new EventEmitter();
    task = t.spawn(onceEmit(source, 'event'))
    source.emit('event', 1,2,3);
  });

  it('returns all parameters of the event as an array', function*() {
    expect(yield task).toEqual([1,2,3]);
  });
});
