import './helpers';

import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect'

import { Effection, Task } from '@effection/core';
import { EventEmitter } from 'events';

import { throwOnErrorEvent } from '../src/index';

describe("throwOnErrorEvent", () => {
  let emitter: EventEmitter;
  let task: Task;
  let error: Error;

  beforeEach(async () => {
    emitter = new EventEmitter();
    task = Effection.root.spawn(function*(task) {
      throwOnErrorEvent(task, emitter);
      yield;
    });
  });

  describe('throws an error when the event occurs', () => {
    beforeEach(() => {
      error = new Error("moo");
      emitter.emit("error", error);
    });

    it('throws error', async () => {
      await expect(task).rejects.toEqual(error);
    });
  });
});

