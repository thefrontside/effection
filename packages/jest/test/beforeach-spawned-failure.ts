import { describe, beforeEach, it } from '../src/index';
import { spawn, sleep } from 'effection';

describe('@effection/jest', () => {
  beforeEach(function*() {
    yield spawn(function*() {
      yield sleep(10);
      throw new Error('boom');
    });
  });

  it('throws error when spawn in beforeEach fails', function*() {
    yield sleep(100);
  });
});
