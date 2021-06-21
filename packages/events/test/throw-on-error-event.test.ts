import { describe, it, beforeEach, captureError } from '@effection/mocha';
import expect from 'expect'

import { Task } from '@effection/core';
import { EventEmitter } from 'events';

import { throwOnErrorEvent } from '../src/index';

describe("throwOnErrorEvent", () => {
  let emitter: EventEmitter;
  let task: Task;
  let error: Error;

  beforeEach(function*(t) {
    emitter = new EventEmitter();
    task = t.spawn(captureError(function*(inner) {
      inner.spawn(throwOnErrorEvent(emitter));
      yield;
    }));
  });

  describe('throws an error when the event occurs', () => {
    beforeEach(function*() {
      error = new Error("moo");
      emitter.emit("error", error);
    });

    it('throws error', function*() {
      expect(yield task).toEqual(error);
    });
  });
});

