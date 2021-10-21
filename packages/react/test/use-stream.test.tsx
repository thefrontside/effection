import { describe, it } from '@effection/mocha';
import expect from 'expect';
import { createChannel, sleep, Stream } from 'effection';
import { useStream } from '../src/index';
import React from 'react';
import { ReactTestRenderer } from 'react-test-renderer';
import { render } from './helpers';

type TestComponentProps = {
  stream: Stream<string>;
}

describe('useStream', () => {
  it('updates the component when a new value is pushed to the stream', function*() {
    function TestComponent(props: TestComponentProps): JSX.Element {
      let value = useStream(props.stream);
      return (
        <h1>{value}</h1>
      );
    }

    let channel = createChannel<string>();
    let renderer: ReactTestRenderer = yield render(
      <TestComponent stream={channel.stream}/>
    );

    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: null });

    channel.send("hello");
    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['hello'] });

    channel.send("world");
    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['world'] });
  });

  it('can set initial value', function*() {
    function TestComponent(props: TestComponentProps): JSX.Element {
      let value = useStream(props.stream, 'monkey');
      return (
        <h1>{value}</h1>
      );
    }

    let channel = createChannel<string>();
    let renderer: ReactTestRenderer = yield render(
      <TestComponent stream={channel.stream}/>
    );

    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['monkey'] });

    channel.send("hello");
    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['hello'] });
  });
});
