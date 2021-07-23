import './setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { run, Effection, Task } from '../src/index';

describe('run', () => {
  it('adds the new task to the global task', () => {
    let task = run(Promise.resolve(123));
    expect(Effection.root.children.includes(task as Task)).toEqual(true);
  });
});
