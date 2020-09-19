import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect'

import { Task } from 'effection';
import { EventEmitter } from 'events';

import { World } from './helpers';

import { throwOnErrorEvent } from '../src/index';

describe("throwOnErrorEvent", () => {
  let emitter: EventEmitter;
  let task: Task;
  let error: Error;

  beforeEach(async () => {
    emitter = new EventEmitter();
    task = World.spawn(function*() {
      yield throwOnErrorEvent(emitter);
      yield;
    });
  });

  describe('throws an error when the event occurs', () => {
    beforeEach(() => {
      error = new Error("moo");
      console.log("after creating error");
      emitter.emit("error", error);
    });

    it('throws error', async () => {
      await expect(task).rejects.toEqual(error);
    });
  });
});

