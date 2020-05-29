import * as expect from 'expect';
import { spawn } from './helpers';

import { Subscription, createSubscription } from '../src/index';

import { Semaphore } from '../src/semaphore';

describe('subscriptions', () => {
  let publish: (value: string) => void;
  let complete: Semaphore<void>;
  let next: Semaphore<void>;
  let result: Promise<number>;
  let seen: string[];

  beforeEach(() => {
    complete = new Semaphore();
    next = new Semaphore();
    seen = [];
    result = spawn(function*() {
      let subscription: Subscription<string,number> = yield createSubscription<string,number>(function*(_publish) {
        publish = _publish;
        yield complete.wait();
        return 42;
      });

      while (true) {
        let current: IteratorResult<string, number> = yield subscription.next();
        if (current.done) {
          complete.signal();
          return current.value;
        } else {
          seen.push(current.value);
          next.signal();
        }
      }
    }).catch(e => e);
  });

  describe('publishing a result', () => {
    beforeEach(async () => {
      let wait = next.wait();
      publish('hello world');
      await wait;
    });
    it('updates the current', () => {
      expect(seen).toEqual(['hello world']);
    });
  });

  describe('publishing a whole bunch of results', () => {
    beforeEach(async () => {
      let [one, two, three] = [next.wait(), next.wait(), next.wait()];
      publish('hello bob');
      publish('hello anne');
      publish('hello roxy');
      await Promise.all([one, two, three]);
    });

    it('has the last result', () => {
      expect(seen).toEqual([
        'hello bob',
        'hello anne',
        'hello roxy'
      ]);
    });

    describe('and then returning', () => {
      let num: number;
      beforeEach(async () => {
        complete.signal();
        num = await result;
      });
      it('marks the loop as being completed', () => {
        expect(num).toEqual(42);
      });
    });

  });

});
