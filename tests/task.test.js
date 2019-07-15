/* global describe, it */
import expect from 'expect';

import task from '../src/task';
import isGeneratorFunction from '../src/is-generator';

describe('Task', () => {
  it('can convert a generator into a generator :)', () => {
    expect(isGeneratorFunction(task(function*() {}).generator)).toEqual(true);
  });

  it('can convert a constant into a generator', () => {
    expect(isGeneratorFunction(task(5).generator)).toEqual(true);
  });

  it('can convert a function into a generator', () => {
    expect(isGeneratorFunction(task(() => 5).generator)).toEqual(true);
  });
});
