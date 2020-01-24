/* global describe, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';

import { compile, any } from '../src/pattern';

describe('Pattern Match', () => {
  describe('with undefined', () => {
    let match = compile(undefined);

    it('returns true for primitive', () => {
      expect(match("thing")).toEqual(true);
    });

    it('returns true for object', () => {
      expect(match({ some: "object" })).toEqual(true);
    });

    it('returns true for array', () => {
      expect(match({ some: "array" })).toEqual(true);
    });
  });

  describe('with primitive', () => {
    let match = compile("thing");

    it('returns true for matching primitive', () => {
      expect(match("thing")).toEqual(true);
    });

    it('returns false for non-matching primitive', () => {
      expect(match("moo")).toEqual(false);
    });

    it('returns false for primitive with other type', () => {
      expect(match(123)).toEqual(false);
    });

    it('returns false for object', () => {
      expect(match({ some: "object" })).toEqual(false);
    });

    it('returns false for array', () => {
      expect(match({ some: "array" })).toEqual(false);
    });
  });


  describe('with predicate function', () => {
    let match = compile((value) => value % 2 === 0);

    it('returns true if predicate matches', () => {
      expect(match(2)).toEqual(true);
    });

    it('returns false if predicate does not match', () => {
      expect(match(3)).toEqual(false);
    });
  });

  describe('with simple array', () => {
    let match = compile([1, "moo"]);

    it('returns true if array matches', () => {
      expect(match([1, "moo"])).toEqual(true);
    });

    it('returns true if array contains extra elements', () => {
      expect(match([1, "moo", true])).toEqual(true);
    });

    it('returns false if array does not match', () => {
      expect(match([true])).toEqual(false);
    });

    it('returns false if array partially matches', () => {
      expect(match([1])).toEqual(false);
    });

    it('returns false for primitive', () => {
      expect(match(123)).toEqual(false);
    });

    it('returns false for object', () => {
      expect(match({ some: "object" })).toEqual(false);
    });
  });

  describe('with array where values are matchers', () => {
    let match = compile([{ some: "object" }, (val) => val === 2]);

    it('returns true if array matches', () => {
      expect(match([{ some: "object" }, 2])).toEqual(true);
    });

    it('returns false if any element does not match', () => {
      expect(match([{ some: "object" }, 4])).toEqual(false);
    });
  });

  describe('with simple object', () => {
    let match = compile({ some: "object", and: 123 });

    it('returns true for match', async () => {
      expect(match({ some: "object", and: 123 })).toEqual(true);
    });

    it('returns true for match with additional properties', async () => {
      expect(match({ some: "object", and: 123, moo: true })).toEqual(true);
    });

    it('returns false for primitive', () => {
      expect(match(123)).toEqual(false);
    });

    it('returns false for arrays', () => {
      expect(match([123])).toEqual(false);
    });

    it('returns false for partial match', async () => {
      expect(match({ some: "object" })).toEqual(false);
    });

    it('returns false if only keys match', async () => {
      expect(match({ some: "thing", and: 321 })).toEqual(false);
    });
  });

  describe('with object where values are pattern matchers', () => {
    let match = compile({ some: (val) => val === 2, thing: [1] });

    it('returns true if object matches', () => {
      expect(match({ some: 2, thing: [1] })).toEqual(true);
    });

    it('returns false if any property does not match', () => {
      expect(match({ some: 2, thing: [false] })).toEqual(false);
    });
  });

  describe('with any matcher', () => {
    let match = compile(any());

    it('always returns true', () => {
      expect(match(123)).toEqual(true);
      expect(match("moo")).toEqual(true);
      expect(match({ some: "object" })).toEqual(true);
    });
  });

  describe('with any matcher with type', () => {
    let match = compile(any("string"));

    it('returns true if value matches type', () => {
      expect(match("moo")).toEqual(true);
    });

    it('returns false if value does not match type', () => {
      expect(match(123)).toEqual(false);
    });
  });

  describe('with any matcher with array', () => {
    let match = compile(any("array"));

    it('returns true if value is an array', () => {
      expect(match([1, 2])).toEqual(true);
    });

    it('returns false if value is not an array', () => {
      expect(match(123)).toEqual(false);
      expect(match({ some: "object" })).toEqual(false);
    });
  });
});
