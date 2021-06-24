import './setup';
import expect from 'expect';
import { describe, it } from '@effection/mocha';
import { Task, YieldingToTask, ChildTask, Label } from './interactors';

import React from 'react';
import ReactDOM from 'react-dom';

import { InspectTree } from '@effection/inspect-utils';

import { TaskTree } from '../app/task-tree';

describe("TaskTree", () => {
  it("Renders a basic task", function*() {
    let tree: InspectTree = {
      id: 123,
      labels: { name: 'Some task', frobs: 'quox' },
      type: 'generator function',
      state: 'running',
      children: {
        777: {
          id: 777,
          labels: { name: 'First child' },
          type: 'generator function',
          state: 'running',
          yieldingTo: undefined,
          children: {},
        },
        999: {
          id: 999,
          labels: { name: 'Second child' },
          type: 'generator function',
          state: 'running',
          yieldingTo: undefined,
          children: {},
        }
      },
      yieldingTo: {
        id: 556,
        labels: { name: 'Yielding to this' },
        type: 'async function',
        state: 'running',
        yieldingTo: undefined,
        children: {},
      }
    }
    ReactDOM.render(<TaskTree tree={tree}/>, document.querySelector('#test'));

    yield Task('Some task').has({ taskId: '[123]', type: 'generator function' });
    yield Task('Some task').find(Label('frobs')).has({ value: 'quox' });
    yield Task('Some task').find(YieldingToTask('Yielding to this')).has({ taskId: '[556]' });
    yield Task('Some task').find(ChildTask('First child')).has({ taskId: '[777]' });
    yield Task('Some task').find(ChildTask('Second child')).has({ taskId: '[999]' });
  });
});
