import './setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { run, Effection, Task } from '../src/index';

describe('run', () => {
  it('adds the new task to the global task', () => {
    let task = run(Promise.resolve(123))
    expect(Effection.root.children.has(task as Task)).toEqual(true);
  });
});
