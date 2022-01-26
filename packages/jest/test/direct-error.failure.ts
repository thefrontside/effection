import { describe, it } from '../src/index';

describe('@effection/jest', () => {
  it('throws error directly', function*() {
    throw new Error('boom');
  });
});
