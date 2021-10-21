import { describe, it } from '@effection/mocha';
import expect from 'expect';
import { sleep } from 'effection';
import { createAtom, Slice } from '@effection/atom';
import { useSlice } from '../src/index';
import React from 'react';
import { ReactTestRenderer } from 'react-test-renderer';
import { render } from './helpers';

type TestComponentProps = {
  slice: Slice<string>;
}

describe('useSlice', () => {
  it('updates the component when a new value is set on the slice', function*() {
    function TestComponent(props: TestComponentProps): JSX.Element {
      let value = useSlice(props.slice);
      return (
        <h1>{value}</h1>
      );
    }

    let slice = createAtom<string>("monkey");
    let renderer: ReactTestRenderer = yield render(
      <TestComponent slice={slice}/>
    );

    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ["monkey"] });

    slice.set("hello");
    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['hello'] });

    slice.set("world");
    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['world'] });
  });
});
