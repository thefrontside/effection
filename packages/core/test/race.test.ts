import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect';

import { Deferred, Task, race, run } from '../src/index';

describe('race()', () => {
  let contestants: Deferred<number>[];
  let task: Task<number>;
  let draw = () => contestants[Math.floor(Math.random() * contestants.length)];


  beforeEach(() => {
    contestants = Array.from(Array(100)).map(() => Deferred<number>());

    task = run(race(contestants.map(op => op.promise)));
  });

  describe('when a winner emerges', () => {
    beforeEach(() => {
      let winner = draw();
      winner.resolve(42);
    });

    it('assumes that result as the race result', async () => {
      await expect(task).resolves.toBe(42);
    });
  });

  describe('when any of the contestants fails', () => {
    beforeEach(() => {
      let failer = draw();
      failer.reject(new Error('kaboom!'));
    });

    it('rejects the task with the same error', async () => {
      await expect(task).rejects.toMatchObject({ message: 'kaboom!' });
    });
  });

});
