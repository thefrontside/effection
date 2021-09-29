import expect from 'expect';
import { describe, it } from '@effection/mocha';

import { createBuffer } from '../src/buffer';

describe('createBuffer', () => {
  it('limits pushed values', function*() {
    let buffer = createBuffer<number>(3);

    buffer.push(1);
    buffer.push(2);
    expect(Array.from(buffer)).toEqual([1,2]);

    buffer.push(3);
    expect(Array.from(buffer)).toEqual([1,2,3]);

    buffer.push(4);
    expect(Array.from(buffer)).toEqual([2,3,4]);
  });

  it('can iterate half full buffer', function*() {
    let buffer = createBuffer<number>(3);

    buffer.push(1);
    buffer.push(2);

    let result = [];
    for(let value of buffer) {
      result.push(value);
    }
    expect(result).toEqual([1,2]);
  });

  it('can iterate full buffer', function*() {
    let buffer = createBuffer<number>(3);

    buffer.push(1);
    buffer.push(2);
    buffer.push(3);

    let result = [];
    for(let value of buffer) {
      result.push(value);
    }
    expect(result).toEqual([1,2,3]);
  });

  it('can iterate overfull buffer', function*() {
    let buffer = createBuffer<number>(3);

    buffer.push(1);
    buffer.push(2);
    buffer.push(3);
    buffer.push(4);

    let result = [];
    for(let value of buffer) {
      result.push(value);
    }
    expect(result).toEqual([2,3,4]);
  });

  it('does nothing when iterating empty buffer', function*() {
    let buffer = createBuffer<number>(3);

    let result = [];
    for(let value of buffer) {
      result.push(value);
    }
    expect(result).toEqual([]);
  });
});
