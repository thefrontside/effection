import expect from 'expect';
import { describe, it } from '@effection/mocha';
import { createStream } from '@effection/stream';

import { createOutputStream } from '../src/output-stream';

const b = (value: string) => Buffer.from(value, 'utf8');

describe('createOutputStream', () => {
  it('can be created from regular stream', function*() {
    let stream = createStream<Buffer>(function*(publish) {
      publish(b("foo"));
      publish(b("bar"));
      publish(b("baz"));
      return undefined;
    });
    let ioStream = createOutputStream(stream);
    let values: Buffer[] = [];

    yield ioStream.forEach((item) => function*() { values.push(item); });
    expect(values).toEqual([b("foo"), b("bar"), b("baz")]);
  });

  it('works like a regular stream', function*() {
    let stream = createOutputStream(function*(publish) {
      publish(b("foo"));
      publish(b("bar"));
      publish(b("baz"));
      return undefined;
    });
    let values: Buffer[] = [];

    yield stream.forEach((item) => function*() { values.push(item); });
    expect(values).toEqual([b("foo"), b("bar"), b("baz")]);
  });

  describe('text()', () => {
    it('maps output to string', function*() {
      let stream = createOutputStream(function*(publish) {
        publish(b("foo"));
        publish(b("bar"));
        publish(b("baz"));
        return undefined;
      });
      let values: string[] = [];

      yield stream.text().forEach((item) => function*() { values.push(item); });
      expect(values).toEqual(["foo", "bar", "baz"]);
    });
  });

  describe('lines()', () => {
    it('combines output into complete lines', function*() {
      let stream = createOutputStream(function*(publish) {
        publish(b("foo\nhello"));
        publish(b("world\n"));
        publish(b("something"));
        return undefined;
      });
      let values: string[] = [];

      yield stream.lines().forEach((item) => function*() { values.push(item); });
      expect(values).toEqual(["foo", "helloworld", "something"]);
    });
  });
});
