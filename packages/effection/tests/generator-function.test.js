/* global describe, it */
import expect from 'expect';

import { isGeneratorFunction, toGeneratorFunction } from '../src/generator-function.js';

describe('Working With Generator Functions', () => {
  describe('recognizing generator functions', () => {
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

  describe('converting generator functions', () => {
    it('can convert a generator into a generator :)', () => {
      expect(isGeneratorFunction(toGeneratorFunction(function*() {}))).toEqual(true);
    });

    it('can convert a constant into a generator', () => {
      expect(isGeneratorFunction(toGeneratorFunction(5))).toEqual(true);
    });

    it('can convert a function into a generator', () => {
      expect(isGeneratorFunction(toGeneratorFunction(() => 5))).toEqual(true);
    });
  });
});
