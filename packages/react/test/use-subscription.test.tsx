import { describe, it } from '@effection/mocha';
import expect from 'expect';
import { createQueue, Subscription } from '@effection/subscription';
import { sleep } from '@effection/core';
import { useSubscription } from '../src/index';
import React from 'react';
import { ReactTestRenderer } from 'react-test-renderer';
import { render } from './helpers';

type TestComponentProps = {
  subscription: Subscription<string>;
}

function TestComponent(props: TestComponentProps): JSX.Element {
  let value = useSubscription(props.subscription);
  return (
    <h1>{value}</h1>
  )
}

describe('useSubscription', () => {
  it('updates the component when a new value is pushed to the subscription', function*() {
    let queue = createQueue<string>();
    let renderer: ReactTestRenderer = yield render(
      <TestComponent subscription={queue.subscription}/>
    );

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: null });

    yield queue.send("hello");
    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['hello'] });

    yield queue.send("world");
    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['world'] });
  });
});
