import './setup';
import { describe, it, beforeEach } from '@effection/mocha';
import { spawn } from '@effection/core';
import { createAtom, Slice } from '@effection/atom';
import { EffectionContext } from '@effection/react';
import { Button } from '@interactors/html';
import { InspectState } from '@effection/inspect-utils';
import { MemoryRouter } from 'react-router-dom';

import { Task, YieldingToTask, ChildTask, Label } from './interactors';

import React from 'react';
import ReactDOM from 'react-dom';

import { App } from '../app/app';

let task: InspectState = {
  id: 123,
  labels: { name: 'Some task', frobs: 'quox' },
  type: 'generator function',
  state: 'running',
  children: [
    {
      id: 777,
      labels: { name: 'First child' },
      type: 'generator function',
      state: 'running',
      yieldingTo: undefined,
      children: [],
    },
    {
      id: 999,
      labels: { name: 'Second child' },
      type: 'generator function',
      state: 'running',
      yieldingTo: undefined,
      children: [],
    }
  ],
  yieldingTo: {
    id: 556,
    labels: { name: 'Yielding to this' },
    type: 'async function',
    state: 'running',
    yieldingTo: undefined,
    children: [],
  }
};

describe("TaskTree", () => {
  beforeEach(function*() {
    let slice: Slice<InspectState> = createAtom(task);

    ReactDOM.render(
      <EffectionContext.Provider value={yield spawn()}>
        <MemoryRouter>
          <App slice={slice}/>
        </MemoryRouter>
      </EffectionContext.Provider>,
      document.querySelector('#test')
    );
  });

  it("Renders a basic task", function*() {
    yield Task('Some task').has({ taskId: '[id: 123]', type: 'generator function' });
    yield Task('Some task').find(Label('frobs')).has({ value: 'quox' });
    yield Task('Some task').find(YieldingToTask('Yielding to this')).has({ taskId: '[id: 556]' });
    yield Task('Some task').find(ChildTask('First child')).has({ taskId: '[id: 777]' });
    yield Task('Some task').find(ChildTask('Second child')).has({ taskId: '[id: 999]' });
  });

  it("can collapse a task", function*() {
    yield Task('Some task').find(ChildTask('Second child')).exists();
    yield Task('Some task').find(Button({ title: 'Collapse Some task' })).click();
    yield Task('Some task').find(ChildTask('Second child')).absent();
    yield Task('Some task').find(Button({ title: 'Expand Some task' })).click();
    yield Task('Some task').find(ChildTask('Second child')).exists();
  });
});
