/* global describe, it */

import expect from 'expect';

import isGeneratorFunction from '../src/is-generator';

describe('isGeneratorFunction', () => {
  it('recognizes generator functions', () => {
    function* generateStuff() {}
    expect(isGeneratorFunction(generateStuff)).toEqual(true);
  });
  it('recognizes normal functions as not generators', () => {
    expect(isGeneratorFunction(() => {})).toEqual(false);
  });
  it('recognizes null as not a generator', () => {
    expect(isGeneratorFunction(null)).toEqual(false);
  });
  it('recognizes normal objects as not generators', () => {
    expect(isGeneratorFunction({})).toEqual(false);
  });
});
