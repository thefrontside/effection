import { describe, beforeAll, it } from '../src/index';
import { spawn, sleep } from 'effection';

describe('@effection/vitest', () => {
  beforeAll(function* () {
    yield spawn(function* () {
      yield sleep(50);
      throw new Error('boom!');
    });
  });
  it('throws the error', function* () {
    yield sleep(100);
  });
});
