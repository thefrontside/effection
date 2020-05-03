import { describe, beforeEach, it } from 'mocha';
import * as expect from 'expect';

import { run } from '../src/index';

describe('run', () => {
  it('runs a promise to completion', function() {
    let result = run(Promise.resolve(123))
    expect(result).resolves.toEqual(123);
  });

  it('can compose multiple promises via generator', function() {
    let result = run(function*() {
      let one: number = yield Promise.resolve(12);
      let two: number = yield Promise.resolve(55);
      return one + two;
    });
    expect(result).resolves.toEqual(67);
  });
});
