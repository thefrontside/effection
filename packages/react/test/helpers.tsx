import * as TestRenderer from 'react-test-renderer';
import { ensure, Effection, Resource } from '@effection/core';
import { EffectionContext } from '../src/index';
import * as React from 'react';

export function render(element: JSX.Element): Resource<TestRenderer.ReactTestRenderer> {
  return {
    *init() {
      let renderer = TestRenderer.create(
        <EffectionContext.Provider value={Effection.root}>
          {element}
        </EffectionContext.Provider>
      );
      yield ensure(() => { renderer.unmount() });
      return renderer;
    }
  }
}
