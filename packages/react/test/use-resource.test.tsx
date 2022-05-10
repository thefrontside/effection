import { describe, it } from '@effection/mocha';
import expect from 'expect';

import React from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';
import { render } from './helpers';
import { useResource } from '../src/';

import { sleep, spawn, createFuture } from 'effection';

describe("use-resource", () => {

  it('is loading while the resource is initializing', function*() {
    function Test() {
      let handle = useResource(new Promise(() => {}));
      return <h1>{handle.type}</h1>
    }

    let renderer: ReactTestRenderer = yield render(<Test/>);
    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['pending'] });
  });

  it('provides a handle to the resource when initialization succeeds', function*() {
    let resolve = Promise.resolve('hello');

    function Test() {
      let handle = useResource(resolve);
      return <h1>{handle.type === 'resolved' ? handle.value : null }</h1>
    }

    let renderer: ReactTestRenderer = yield render(<Test/>);
    yield resolve;
    yield tick();

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['hello'] });
  });

  it('marks the resource state as rejected when initialization fails', function*() {
    let explode = Promise.reject(new Error('boom!'));
    function Test() {
      let handle = useResource(explode);
      return <h1>{handle.type === 'rejected' ? handle.error.message: null }</h1>
    }

    let renderer: ReactTestRenderer = yield render(<Test/>);
    yield explode.catch(() => {});
    yield tick();
    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['boom!'] });
  });

  it('marks the resource state as rejected when initialization succeeds, but resource subsequently fails', function*() {

    let { resolve, future } = createFuture<void>();

    function Test() {
      let handle = useResource({
        name: 'Test',
        *init() {
          yield spawn(function* Box() {
            yield future;
            throw new Error('boom!');
          });
          return 'hello';
        }
      });

      if (handle.type === 'resolved') {
        return <h1>{handle.value}</h1>;
      } else if (handle.type === 'rejected') {
        return <h1>{handle.error.message}</h1>;
      } else {
        return <h1>pending</h1>
      }
    }

    let renderer: ReactTestRenderer = yield render(<Test/>);

    yield tick();
    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['hello']});

    resolve();
    yield tick();
    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['boom!']});
  });
});

const tick = () => sleep(0);
