import { describe, it } from '../src/index';

describe('@effection/vitest', () => {
  it('throws error directly', function* () {
    throw new Error('boom');
  });
});
