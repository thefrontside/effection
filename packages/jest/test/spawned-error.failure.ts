import { describe, it } from '../src/index';
import { spawn, sleep } from 'effection';

describe('@effection/jest', () => {
  it('throws error in background task', function*() {
    yield spawn(function*() {
      yield sleep(5);
      throw new Error('boom');
    });
    yield sleep(100);
  });
});
